import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
const server=(process.env.YAPOSAN_RUNTIME_BASE_URL||"http://127.0.0.1:4100").replace(/\/$/,"");
const bg=(process.env.BACKGROUND_REMOVAL_URL||"http://127.0.0.1:8090").replace(/\/$/,"");
const web=(process.env.YAPOSAN_WEB_URL||"http://127.0.0.1:8081").replace(/\/$/,"");
const token=process.env.YAPOSAN_ACCESS_TOKEN||"";
const sample=process.env.PHASE9115_SAMPLE_IMAGE||"";
const report={phase:"91.15",startedAt:new Date().toISOString(),checks:[],interactiveRequired:[]};
function record(name,pass,detail=""){report.checks.push({name,pass,detail});console[pass?"log":"error"](`${pass?"PASS":"FAIL"} ${name}${detail?`: ${detail}`:""}`);return pass;}
async function probe(name,url){try{const r=await fetch(url,{signal:AbortSignal.timeout(7000)});return record(name,r.ok,`HTTP ${r.status}`)}catch(e){return record(name,false,e instanceof Error?e.message:String(e))}}
async function authJson(path,init={}){const r=await fetch(`${server}${path}`,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${token}`,...(init.headers||{})},signal:AbortSignal.timeout(60000)});let data={};try{data=await r.json()}catch{}return {r,data}}
await probe("Yaposan API health",`${server}/health`);
await probe("Background removal health",`${bg}/health`);
await probe("Background removal readiness",`${bg}/readiness`);
await probe("Expo web",web);
if(token){
  const {r,data}=await authJson("/api/v1/ai/media/capabilities");
  record("Authenticated media capability endpoint",r.ok,JSON.stringify({image:data?.image?.configured,video:data?.video?.configured,audio:data?.audio?.configured,backgroundRemoval:data?.backgroundRemoval?.configured}));
  for(const kind of ["image","video","audio"]){ if(!data?.[kind]?.configured) report.interactiveRequired.push(`Configure and verify one real ${kind} provider if ${kind} creation is advertised.`); }
}else report.interactiveRequired.push("Set YAPOSAN_ACCESS_TOKEN to certify authenticated media routes.");
if(token && sample && existsSync(sample)){
  const imageBase64=readFileSync(sample).toString("base64");
  const ext=basename(sample).toLowerCase(); const mime=ext.endsWith(".jpg")||ext.endsWith(".jpeg")?"image/jpeg":ext.endsWith(".webp")?"image/webp":"image/png";
  for(const [name,background,color] of [["Transparent cutout","transparent",undefined],["Exact white background","white",undefined],["Custom color background","custom","#336699"]]){
    const {r,data}=await authJson("/api/v1/image/background-remove",{method:"POST",body:JSON.stringify({imageBase64,mimeType:mime,background,backgroundColor:color,qualityMode:"quality",outputFormat:"png",strictWhite:background==="white",whiteAuditThreshold:1})});
    let pass=r.ok && typeof data?.imageBase64==="string" && data.imageBase64.length>100;
    if(background==="white") pass=pass && data?.postExportWhiteAudit?.certified!==false && data?.post_export_white_audit?.certified!==false;
    record(name,pass,r.ok?`output bytes(base64) ${data?.imageBase64?.length||0}`:`HTTP ${r.status}`);
  }
}else report.interactiveRequired.push("Set PHASE9115_SAMPLE_IMAGE to a real local image path to certify transparent/white/custom background output through the authenticated API.");
for(const item of [
  "In browser: Magic Eraser with a painted/imported mask and verify only the masked object is removed.",
  "In browser: AI Expand 1:1, 4:5 and 16:9; verify generated surroundings are not a stretched source.",
  "In browser: Relight direction/strength visibly changes illumination.",
  "In browser: Upscale 2x/4x produces larger real output dimensions with useful detail.",
  "In browser: Product Scene presets create distinct scenes while preserving the product.",
  "Save/reload the edited project, then Undo/Redo across at least three operations.",
  "Export PNG/JPEG/WebP as applicable and open the exported file outside Yaposan.",
  "Run all What will you create today routes and verify editable destination projects.",
  "Test invalid API key, timeout, quota exceeded and offline behavior; no fake-success path is allowed.",
  "Inspect browser network/build output to confirm provider API keys never reach the client."
]) report.interactiveRequired.push(item);
report.finishedAt=new Date().toISOString();
report.automatedPass=report.checks.length>0 && report.checks.every(x=>x.pass);
writeFileSync("PHASE91.15-LOCAL-CERTIFICATION.json",JSON.stringify(report,null,2));
console.log(`\nAutomated local checks: ${report.automatedPass?"PASS":"FAIL"}. Interactive checks remaining: ${report.interactiveRequired.length}.`);
console.log("Report: PHASE91.15-LOCAL-CERTIFICATION.json");
if(!report.automatedPass)process.exit(1);
