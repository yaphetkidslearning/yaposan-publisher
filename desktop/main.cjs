const { app, BrowserWindow, dialog, ipcMain, shell, net } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

const isDev = !app.isPackaged;
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();
let mainWindow = null;
let autoUpdater = null;
let updateStatus = { state: "idle", currentVersion: app.getVersion(), channel: "stable" };
const defaultPolicy = { channel: "stable", automaticChecks: true, automaticDownload: false, installOnQuit: true };
let updatePolicy = { ...defaultPolicy };
const defaultTelemetryConsent = { enabled:false, crashReports:false, performanceMetrics:false, anonymousUsage:false, updatedAt:0 };
let telemetryConsent = { ...defaultTelemetryConsent };
let telemetryEvents = [];
const telemetrySessionId = `desktop-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
function telemetryPath(){ return path.join(app.getPath("userData"), "telemetry-diagnostics.json"); }
function telemetryAllowed(category){ return telemetryConsent.enabled && ((category === "crash" && telemetryConsent.crashReports) || (category === "performance" && telemetryConsent.performanceMetrics) || (category === "usage" && telemetryConsent.anonymousUsage)); }
function loadTelemetry(){ try { const saved=JSON.parse(fs.readFileSync(telemetryPath(),"utf8")); telemetryConsent={...defaultTelemetryConsent,...saved.consent}; telemetryEvents=Array.isArray(saved.events)?saved.events.slice(-500):[]; } catch { telemetryConsent={...defaultTelemetryConsent}; telemetryEvents=[]; } }
function saveTelemetry(){ fs.mkdirSync(path.dirname(telemetryPath()),{recursive:true}); fs.writeFileSync(telemetryPath(),JSON.stringify({consent:telemetryConsent,events:telemetryEvents},null,2)); }
function telemetrySnapshot(){ return { consent:telemetryConsent, queuedEvents:telemetryEvents.length, recentEvents:[...telemetryEvents].slice(-50).reverse(), sessionId:telemetrySessionId, storage:"desktop" }; }
function recordTelemetry(event){ if(!event || !["crash","performance","usage"].includes(event.category) || !telemetryAllowed(event.category)) return false; const cleanProperties={}; for(const [key,value] of Object.entries(event.properties||{})){ if(["string","number","boolean"].includes(typeof value)) cleanProperties[String(key).slice(0,80)]=typeof value==="string"?value.slice(0,250):value; } telemetryEvents.push({ id:`${telemetrySessionId}-${telemetryEvents.length+1}`, category:event.category, name:String(event.name||"event").slice(0,120), timestamp:Date.now(), ...(Number.isFinite(event.durationMs)?{durationMs:Math.max(0,Math.round(event.durationMs))}:{}), ...(Object.keys(cleanProperties).length?{properties:cleanProperties}:{}) }); telemetryEvents=telemetryEvents.slice(-500); saveTelemetry(); return true; }



const MAX_OFFLINE_PROJECT_BYTES = 25 * 1024 * 1024;
function offlineRoot(){ return path.join(app.getPath("userData"), "offline-workspace"); }
function offlineProjectsPath(){ return path.join(offlineRoot(), "projects"); }
function offlineQueuePath(){ return path.join(offlineRoot(), "sync-queue.json"); }
function cleanId(value){ const id=String(value||"").trim(); if(!/^[a-zA-Z0-9._-]{1,120}$/.test(id)) throw new Error("Invalid project identifier."); return id; }
function readJson(filePath,fallback){ try{return JSON.parse(fs.readFileSync(filePath,"utf8"));}catch{return fallback;} }
function atomicJson(filePath,value){ fs.mkdirSync(path.dirname(filePath),{recursive:true}); const temp=`${filePath}.${process.pid}.tmp`; fs.writeFileSync(temp,JSON.stringify(value,null,2)); fs.renameSync(temp,filePath); }
function projectFile(projectId){ return path.join(offlineProjectsPath(),`${cleanId(projectId)}.json`); }
function offlineQueue(){ const value=readJson(offlineQueuePath(),[]); return Array.isArray(value)?value:[]; }
function projectRecords(){ fs.mkdirSync(offlineProjectsPath(),{recursive:true}); return fs.readdirSync(offlineProjectsPath()).filter(x=>x.endsWith(".json")).flatMap(name=>{ try{ const record=readJson(path.join(offlineProjectsPath(),name),null); return record?.metadata?[record.metadata]:[]; }catch{return [];} }).sort((a,b)=>b.updatedAt-a.updatedAt); }
function offlineSnapshot(){ const projects=projectRecords(); return { available:true,online:net.isOnline(),projects,queue:offlineQueue(),storageBytes:projects.reduce((n,p)=>n+(Number(p.bytes)||0),0),lastCheckedAt:Date.now() }; }
function broadcastOffline(){ const snapshot=offlineSnapshot(); for(const win of BrowserWindow.getAllWindows())win.webContents.send("yaposan:offline-status",snapshot); return snapshot; }
function saveOfflineProject(input){ const projectId=cleanId(input?.projectId); const payloadText=JSON.stringify(input?.payload??null); const bytes=Buffer.byteLength(payloadText); if(bytes>MAX_OFFLINE_PROJECT_BYTES)throw new Error("Offline project exceeds the 25 MB desktop limit."); const existing=readJson(projectFile(projectId),null); const updatedAt=Date.now(); const metadata={projectId,name:String(input?.name||existing?.metadata?.name||"Untitled project").slice(0,160),updatedAt,revision:Math.max(1,Number(input?.revision)||Number(existing?.metadata?.revision)||1),bytes,checksum:crypto.createHash("sha256").update(payloadText).digest("hex"),dirty:true}; atomicJson(projectFile(projectId),{metadata,payload:input?.payload??null}); broadcastOffline(); return metadata; }
function queueOfflineOperation(input){ const queue=offlineQueue(); queue.push({id:`sync-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,projectId:cleanId(input?.projectId),type:["create","update","delete"].includes(input?.type)?input.type:"update",createdAt:Date.now(),attempts:0,status:"queued",...(input?.payload===undefined?{}:{payload:input.payload})}); atomicJson(offlineQueuePath(),queue.slice(-1000)); return broadcastOffline(); }
function resolveOfflineOperation(input){ const queue=offlineQueue(); const index=queue.findIndex(x=>x.id===input?.operationId); if(index<0)return offlineSnapshot(); if(input?.success)queue.splice(index,1);else queue[index]={...queue[index],status:"failed",attempts:(queue[index].attempts||0)+1,lastError:String(input?.error||"Synchronization failed").slice(0,300)}; atomicJson(offlineQueuePath(),queue); return broadcastOffline(); }

function sha256(filePath) { const hash = crypto.createHash("sha256"); hash.update(fs.readFileSync(filePath)); return hash.digest("hex"); }
function policyPath() { return path.join(app.getPath("userData"), "desktop-update-policy.json"); }
function loadUpdatePolicy() { try { updatePolicy = { ...defaultPolicy, ...JSON.parse(fs.readFileSync(policyPath(), "utf8")) }; } catch { updatePolicy = { ...defaultPolicy }; } }
function saveUpdatePolicy() { fs.mkdirSync(path.dirname(policyPath()), { recursive: true }); fs.writeFileSync(policyPath(), JSON.stringify(updatePolicy, null, 2)); }
function broadcastUpdateStatus(patch = {}) {
  updateStatus = { ...updateStatus, ...patch, currentVersion: app.getVersion(), channel: updatePolicy.channel };
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send("yaposan:update-status", updateStatus);
  return updateStatus;
}
function normalizeReleaseNotes(notes) {
  if (typeof notes === "string") return notes;
  if (Array.isArray(notes)) return notes.map((item) => item?.note || "").filter(Boolean).join("\n\n");
  return "";
}
function configureUpdater() {
  if (!app.isPackaged) return null;
  try {
    autoUpdater = require("electron-updater").autoUpdater;
    autoUpdater.autoDownload = updatePolicy.automaticDownload;
    autoUpdater.autoInstallOnAppQuit = updatePolicy.installOnQuit;
    autoUpdater.channel = updatePolicy.channel === "development" ? "dev" : updatePolicy.channel;
    autoUpdater.allowPrerelease = updatePolicy.channel !== "stable";
    autoUpdater.on("checking-for-update", () => broadcastUpdateStatus({ state: "checking", error: undefined }));
    autoUpdater.on("update-available", (info) => broadcastUpdateStatus({ state: "available", availableVersion: info.version, releaseName: info.releaseName || `Yaposan ${info.version}`, releaseNotes: normalizeReleaseNotes(info.releaseNotes), checkedAt: Date.now() }));
    autoUpdater.on("update-not-available", () => broadcastUpdateStatus({ state: "not-available", availableVersion: undefined, checkedAt: Date.now() }));
    autoUpdater.on("download-progress", (p) => broadcastUpdateStatus({ state: "downloading", progress: p.percent, bytesPerSecond: p.bytesPerSecond, transferred: p.transferred, total: p.total }));
    autoUpdater.on("update-downloaded", (info) => broadcastUpdateStatus({ state: "downloaded", availableVersion: info.version, progress: 100, releaseName: info.releaseName || `Yaposan ${info.version}`, releaseNotes: normalizeReleaseNotes(info.releaseNotes) }));
    autoUpdater.on("error", (error) => broadcastUpdateStatus({ state: "error", error: error?.message || String(error) }));
    return autoUpdater;
  } catch (error) {
    broadcastUpdateStatus({ state: "error", error: `Updater initialization failed: ${error?.message || error}` });
    return null;
  }
}
async function checkForUpdates() {
  if (!app.isPackaged) return broadcastUpdateStatus({ state: "error", error: "Update checks run only in packaged desktop builds." });
  if (!autoUpdater) configureUpdater();
  if (!autoUpdater) return updateStatus;
  broadcastUpdateStatus({ state: "checking", error: undefined });
  await autoUpdater.checkForUpdates();
  return updateStatus;
}

function isTrustedNavigation(url) {
  if (isDev && process.env.YAPOSAN_DESKTOP_DEV_URL && url.startsWith(process.env.YAPOSAN_DESKTOP_DEV_URL)) return true;
  return url.startsWith("file://");
}
function createWindow() {
  const win = new BrowserWindow({ width:1480,height:960,minWidth:1100,minHeight:700,show:false,backgroundColor:"#101828",webPreferences:{ preload:path.join(__dirname,"preload.cjs"),contextIsolation:true,nodeIntegration:false,sandbox:true } });
  mainWindow = win;
  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action:"deny" }; });
  win.webContents.on("will-navigate", (event, url) => { if (!isTrustedNavigation(url)) event.preventDefault(); });
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  if (isDev && process.env.YAPOSAN_DESKTOP_DEV_URL) win.loadURL(process.env.YAPOSAN_DESKTOP_DEV_URL); else win.loadFile(path.join(app.getAppPath(),"dist","index.html"));
}

ipcMain.handle("yaposan:offline-snapshot", () => offlineSnapshot());
ipcMain.handle("yaposan:offline-save-project", (_event,input) => saveOfflineProject(input));
ipcMain.handle("yaposan:offline-load-project", (_event,projectId) => readJson(projectFile(projectId),null));
ipcMain.handle("yaposan:offline-remove-project", (_event,projectId) => { const file=projectFile(projectId); if(!fs.existsSync(file))return false; fs.unlinkSync(file); broadcastOffline(); return true; });
ipcMain.handle("yaposan:offline-queue-operation", (_event,input) => queueOfflineOperation(input));
ipcMain.handle("yaposan:offline-resolve-operation", (_event,input) => resolveOfflineOperation(input));
ipcMain.handle("yaposan:offline-export-backup", async () => { const result=await dialog.showSaveDialog({title:"Export Yaposan offline backup",defaultPath:`yaposan-offline-backup-${new Date().toISOString().slice(0,10)}.json`,filters:[{name:"Yaposan Backup",extensions:["json"]}]}); if(result.canceled||!result.filePath)return {canceled:true}; const body={version:1,exportedAt:new Date().toISOString(),projects:fs.readdirSync(offlineProjectsPath(),{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith(".json")).map(x=>readJson(path.join(offlineProjectsPath(),x.name),null)).filter(Boolean),queue:offlineQueue()}; atomicJson(result.filePath,body); return {canceled:false,filePath:result.filePath}; });
ipcMain.handle("yaposan:desktop-info", () => ({ appName:app.getName(),version:app.getVersion(),platform:process.platform,arch:process.arch,packaged:app.isPackaged,userDataPath:app.getPath("userData") }));
ipcMain.handle("yaposan:verify-artifact", async (_event,filePath) => { if(typeof filePath!=="string"||!path.isAbsolute(filePath)) throw new Error("An absolute artifact path is required."); const stat=fs.statSync(filePath); if(!stat.isFile()) throw new Error("The selected artifact is not a file."); return {filePath,bytes:stat.size,sha256:sha256(filePath)}; });
ipcMain.handle("yaposan:select-release-directory", async () => { const result=await dialog.showOpenDialog({properties:["openDirectory","createDirectory"]}); return result.canceled?null:result.filePaths[0]; });
ipcMain.handle("yaposan:update-status", () => updateStatus);
ipcMain.handle("yaposan:update-check", () => checkForUpdates());
ipcMain.handle("yaposan:update-download", async () => { if(!autoUpdater) configureUpdater(); if(!autoUpdater) return updateStatus; broadcastUpdateStatus({state:"downloading",error:undefined}); await autoUpdater.downloadUpdate(); return updateStatus; });
ipcMain.handle("yaposan:update-install", () => { if(!autoUpdater || updateStatus.state!=="downloaded") throw new Error("No downloaded update is ready to install."); setImmediate(() => autoUpdater.quitAndInstall(false,true)); });

ipcMain.handle("yaposan:telemetry-snapshot", () => telemetrySnapshot());
ipcMain.handle("yaposan:telemetry-consent", (_event,next) => { telemetryConsent={ enabled:Boolean(next?.enabled), crashReports:Boolean(next?.enabled&&next?.crashReports), performanceMetrics:Boolean(next?.enabled&&next?.performanceMetrics), anonymousUsage:Boolean(next?.enabled&&next?.anonymousUsage), updatedAt:Date.now() }; if(!telemetryConsent.enabled) telemetryEvents=[]; saveTelemetry(); return telemetrySnapshot(); });
ipcMain.handle("yaposan:telemetry-record", (_event,event) => recordTelemetry(event));
ipcMain.handle("yaposan:telemetry-clear", () => { telemetryEvents=[]; saveTelemetry(); return telemetrySnapshot(); });
ipcMain.handle("yaposan:telemetry-export", () => JSON.stringify({generatedAt:new Date().toISOString(),appVersion:app.getVersion(),platform:process.platform,arch:process.arch,...telemetrySnapshot()},null,2));

ipcMain.handle("yaposan:update-policy", (_event,next) => { const channel=["stable","beta","development"].includes(next?.channel)?next.channel:"stable"; updatePolicy={channel,automaticChecks:Boolean(next?.automaticChecks),automaticDownload:Boolean(next?.automaticDownload),installOnQuit:Boolean(next?.installOnQuit)}; saveUpdatePolicy(); if(autoUpdater) configureUpdater(); return broadcastUpdateStatus(); });

app.on("second-instance", () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
app.whenReady().then(() => { loadTelemetry(); loadUpdatePolicy(); configureUpdater(); fs.mkdirSync(offlineProjectsPath(),{recursive:true}); createWindow(); setInterval(()=>broadcastOffline(),15000); if(updatePolicy.automaticChecks && app.isPackaged) setTimeout(() => void checkForUpdates(), 12000); app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();}); });
process.on("uncaughtException", (error) => { recordTelemetry({category:"crash",name:"uncaught-exception",properties:{message:String(error?.message||error).slice(0,250)}}); });
process.on("unhandledRejection", (reason) => { recordTelemetry({category:"crash",name:"unhandled-rejection",properties:{message:String(reason).slice(0,250)}}); });

app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit();});
