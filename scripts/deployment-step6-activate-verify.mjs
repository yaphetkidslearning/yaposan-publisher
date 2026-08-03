import process from "node:process";

const app=(process.env.PUBLIC_APP_URL||"").replace(/\/$/,"");
const api=(process.env.PUBLIC_API_URL||"").replace(/\/$/,"");
const metricsToken=process.env.METRICS_TOKEN||"";
if (!app || !api) { console.error("PUBLIC_APP_URL and PUBLIC_API_URL are required"); process.exit(1); }
const timeoutMs=Number(process.env.ACTIVATION_VERIFY_TIMEOUT_MS||15000);
async function request(name,url,options={}) {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const response=await fetch(url,{redirect:"manual",signal:controller.signal,...options});
    const text=await response.text();
    return {name,url,status:response.status,ok:response.ok,text:text.slice(0,5000),headers:Object.fromEntries(response.headers)};
  } catch(error) { return {name,url,status:0,ok:false,error:String(error)}; }
  finally { clearTimeout(timer); }
}
const checks=[];
checks.push(await request("web",`${app}/`));
checks.push(await request("live",`${api}/live`));
checks.push(await request("health",`${api}/health`));
checks.push(await request("ready",`${api}/ready`));
checks.push(await request("release",`${api}/release`));
if (metricsToken) checks.push(await request("metrics",`${api}/metrics`,{headers:{authorization:`Bearer ${metricsToken}`}}));
const issues=[];
for (const check of checks) if (!check.ok) issues.push(`${check.name} returned ${check.status||check.error}`);
const release=checks.find(c=>c.name==="release");
if (release?.ok) {
  try { const body=JSON.parse(release.text); if (body.version!=="1.0.0") issues.push(`release version is ${body.version||"missing"}, expected 1.0.0`); }
  catch { issues.push("release endpoint did not return valid JSON"); }
}
const ready=checks.find(c=>c.name==="ready");
if (ready?.ok) {
  try { const body=JSON.parse(ready.text); if (body.ready===false || body.status==="not-ready") issues.push("readiness endpoint reports not ready"); }
  catch { issues.push("readiness endpoint did not return valid JSON"); }
}
const report={ok:issues.length===0,checkedAt:new Date().toISOString(),checks:checks.map(({text,...rest})=>rest),issues};
console.log(JSON.stringify(report,null,2));
if (issues.length) process.exit(1);
