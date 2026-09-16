import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import { parseEnv } from "node:util";
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const KNOWN_KEYS = JSON.parse(fs.readFileSync(new URL("../runtime-config-keys.json", import.meta.url), "utf8"));

function envFile() {
  const problems = [];
  if (!fs.existsSync(".env")) return { values: {}, problems };
  const source = fs.readFileSync(".env", "utf8");
  let values = {};
  try { values = parseEnv(source); }
  catch (error) { problems.push(`.env could not be parsed by Node: ${error instanceof Error ? error.message : String(error)}`); }

  // Node owns value parsing. This pass validates only key structure/duplicates and
  // catches accidentally joined Yaposan variables without re-interpreting values.
  const seen = new Set();
  const lines = source.split(/\r?\n/);
  for (let n = 0; n < lines.length; n++) {
    const raw = lines[n];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(trimmed);
    if (!match) continue;
    const key = match[1];
    if (seen.has(key)) problems.push(`.env line ${n + 1} duplicates variable '${key}'`);
    seen.add(key);
    const embedded = KNOWN_KEYS.filter(k => k !== key && key.includes(k));
    if (embedded.length >= 2 || (embedded.length === 1 && key.startsWith("PUBLIC_ORIGINS") && key !== "PUBLIC_ORIGINS")) problems.push(`.env line ${n + 1} looks like two variables were joined together: '${key}'`);
  }
  for (const [key,value] of Object.entries(values)) {
    const embeddedInValue = KNOWN_KEYS.filter(k => String(value).includes(`${k}=`));
    if (embeddedInValue.length) problems.push(`.env value for '${key}' looks like another variable was embedded inside it: ${embeddedInValue.join(", ")}`);
  }
  return { values, problems };
}

const parsed = envFile();
if (parsed.problems.length) {
  console.error("[Yaposan local runtime] Invalid .env configuration:");
  for (const issue of parsed.problems) console.error(` - ${issue}`);
  console.error("Fix .env before starting Yaposan. Each variable must be on its own line.");
  process.exit(1);
}
const file = parsed.values;
const merged = key => String(file[key] ?? process.env[key] ?? "");
const api = (merged("EXPO_PUBLIC_API_URL") || merged("PUBLIC_API_URL") || "http://localhost:4100").replace(/\/$/, "");
let target;
try { target = new URL(api); } catch { console.error(`Invalid EXPO_PUBLIC_API_URL/PUBLIC_API_URL: ${api}`); process.exit(1); }
const expectedVersion = pkg.version;
const isLocal = ["localhost","127.0.0.1","::1"].includes(target.hostname);
const webUrl = merged("PUBLIC_WEB_URL") || merged("PUBLIC_APP_URL") || "http://localhost:8081";
let webTarget;
try { webTarget = new URL(webUrl); } catch { console.error(`Invalid PUBLIC_WEB_URL/PUBLIC_APP_URL: ${webUrl}`); process.exit(1); }
const publicOrigins = (merged("PUBLIC_ORIGINS") || "http://localhost:8081,http://127.0.0.1:8081").split(",").map(x=>x.trim().replace(/\/$/,"").toLowerCase()).filter(Boolean);
if (isLocal && !publicOrigins.includes(webTarget.origin.toLowerCase())) {
  console.error(`[Yaposan ${expectedVersion}] PUBLIC_ORIGINS does not include the configured web origin ${webTarget.origin}.`);
  console.error(`Set PUBLIC_ORIGINS=${webTarget.origin},http://127.0.0.1:${webTarget.port || "8081"} and restart.`);
  process.exit(1);
}

function runtimeFingerprintValue(key) {
  if (key === "EXPO_PUBLIC_API_URL") return api;
  if (key === "PUBLIC_API_URL") return merged("PUBLIC_API_URL") || api;
  if (key === "PUBLIC_WEB_URL") return merged("PUBLIC_WEB_URL") || webUrl;
  if (key === "PUBLIC_APP_URL") return merged("PUBLIC_APP_URL") || webUrl;
  if (key === "PUBLIC_ORIGINS") return publicOrigins.join(",");
  if (key === "PORT") return String(target.port || "4100");
  if (key === "YAPOSAN_LOCAL_DB_PATH") return merged(key) || ".yaposan/local-database.json";
  if (key === "YAPOSAN_LOCAL_DB_LOCK_TIMEOUT_MS") return merged(key) || "30000";
  if (key === "YAPOSAN_LOCAL_DB_STALE_LOCK_MS") return merged(key) || "300000";
  if (key === "YAPOSAN_LOCAL_DB_WARN_BYTES") return merged(key) || "26214400";
  if (key === "YAPOSAN_LOCAL_DEV_TOKEN_PATH") return merged(key) || ".yaposan/local-dev-token";
  if (key === "NODE_ENV") return merged(key) || "development";
  if (key === "REQUIRE_EMAIL_VERIFICATION") return merged(key) || "true";
  return merged(key);
}
function runtimeFingerprint() {
  // Hash every runtime-affecting value, including secrets and the actual DATABASE_URL.
  // Only the final digest is exposed through /health; raw configuration is never returned.
  const selected = Object.fromEntries([...KNOWN_KEYS].sort().map(key => [
    key,
    createHash("sha256").update(`${key}\0${runtimeFingerprintValue(key)}`).digest("hex")
  ]));
  return createHash("sha256").update(JSON.stringify(selected)).digest("hex").slice(0, 24);
}

const expectedFingerprint = runtimeFingerprint();

const children = new Set();
function npmInvocation(args) {
  // npm scripts expose the absolute npm CLI path in npm_execpath. On Windows,
  // spawning npm.cmd directly with shell:false can fail with EINVAL on Node 24.
  // Running npm-cli.js through the current Node executable avoids cmd.exe,
  // preserves shell:false, and works consistently across supported platforms.
  const npmExecPath = String(process.env.npm_execpath ?? "").trim();
  if (npmExecPath && fs.existsSync(npmExecPath)) {
    return { command: process.execPath, args: [npmExecPath, ...args] };
  }
  if (process.platform === "win32") {
    const npmCli = process.env.APPDATA
      ? `${process.env.APPDATA}\\npm\\node_modules\\npm\\bin\\npm-cli.js`
      : "";
    if (npmCli && fs.existsSync(npmCli)) {
      return { command: process.execPath, args: [npmCli, ...args] };
    }
    throw new Error("Unable to locate npm CLI on Windows. Run this launcher through npm (npm run web) so npm_execpath is available.");
  }
  return { command: "npm", args };
}
function runNpm(args, env = {}) {
  const invocation = npmInvocation(args);
  const c = spawn(invocation.command, invocation.args, { stdio: "inherit", shell: false, env: { ...process.env, ...file, ...env } });
  children.add(c);
  c.once("exit", () => children.delete(c));
  c.once("error", error => {
    console.error(`[Yaposan ${expectedVersion}] Failed to start npm child process: ${error.message}`);
    children.delete(c);
    shutdown();
    process.exit(1);
  });
  return c;
}
function stopChild(c) {
  if (!c?.pid || c.killed) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(c.pid), "/t", "/f"], { stdio: "ignore", shell: false });
  else c.kill("SIGTERM");
}
function shutdown() { for (const c of [...children]) stopChild(c); }
async function health() { try { const r=await fetch(`${api}/health`); if(!r.ok)return undefined; return await r.json(); } catch { return undefined; } }
async function wait() { for(let i=0;i<80;i++){const h=await health();if(h)return h;await new Promise(r=>setTimeout(r,250));}return undefined; }
function portBusy(port,host="127.0.0.1") { return new Promise(resolve=>{const s=net.createConnection({port,host});s.once("connect",()=>{s.destroy();resolve(true)});s.once("error",()=>resolve(false));s.setTimeout(500,()=>{s.destroy();resolve(false)});}); }

if (isLocal) {
  const already = await health();
  if (already) {
    const runningVersion = String(already.version ?? "");
    if(runningVersion!==expectedVersion){
      console.error(`[Yaposan ${expectedVersion}] Port ${target.port || "4100"} is already serving Yaposan API version ${runningVersion || "unknown"}. Stop the old API and run npm run web again. Refusing to mix frontend ${expectedVersion} with an incompatible backend.`);
      process.exit(1);
    }
    if (String(already.runtimeConfigFingerprint ?? "") !== expectedFingerprint) {
      console.error(`[Yaposan ${expectedVersion}] A matching API is running, but it was started with different local environment settings.`);
      console.error("Stop the old API/Node process and run npm run web again so .env changes are loaded.");
      process.exit(1);
    }
    console.log(`[Yaposan ${expectedVersion}] Reusing matching API at ${api} with matching environment fingerprint.`);
  } else {
    console.log(`[Yaposan ${expectedVersion}] Starting API at ${api}`);
    runNpm(["run","server"], { PORT:target.port || "4100", EXPO_PUBLIC_API_URL: api, PUBLIC_API_URL: api });
    const ready = await wait();
    if (!ready) { console.error(`[Yaposan ${expectedVersion}] API did not become ready at ${api}. Check server output above.`); shutdown(); process.exit(1); }
    if(String(ready.version??"")!==expectedVersion){console.error(`[Yaposan ${expectedVersion}] Newly started API reported version ${String(ready.version??"unknown")}. Refusing to continue.`);shutdown();process.exit(1);}
    if(String(ready.runtimeConfigFingerprint??"")!==expectedFingerprint){console.error(`[Yaposan ${expectedVersion}] Newly started API environment fingerprint does not match the launcher. Check .env and restart.`);shutdown();process.exit(1);}
  }
} else console.log(`[Yaposan ${expectedVersion}] Using configured remote API ${api}`);

const desiredWebPort = Number(webTarget.port || 8081);
if (await portBusy(desiredWebPort)) {
  console.error(`[Yaposan ${expectedVersion}] Web port ${desiredWebPort} is already in use. Stop the old Expo/Node process instead of switching to another port; switching ports would break the configured CORS origin.`);
  shutdown();
  process.exit(1);
}
console.log(`[Yaposan ${expectedVersion}] Starting Expo web at ${webTarget.origin}...`);
const web = runNpm(["run","web:frontend","--","--port",String(desiredWebPort)], { EXPO_PUBLIC_API_URL: api });
let shuttingDown = false;
function requestShutdown(code=0) { if(shuttingDown)return; shuttingDown=true; shutdown(); process.exitCode=code; }
process.on("SIGINT",()=>requestShutdown(130));
process.on("SIGTERM",()=>requestShutdown(143));
web.on("exit",code=>requestShutdown(code ?? 0));
