const web = process.env.YAPOSAN_WEB_URL;
const api = process.env.YAPOSAN_API_URL;
const token = process.env.METRICS_TOKEN;
if (!web || !api) { console.error('Set YAPOSAN_WEB_URL and YAPOSAN_API_URL'); process.exit(1); }
const checks=[
  ['web', `${web.replace(/\/$/,'')}/`],
  ['api-live', `${api.replace(/\/$/,'')}/live`],
  ['api-health', `${api.replace(/\/$/,'')}/health`],
  ['api-ready', `${api.replace(/\/$/,'')}/ready`],
  ['api-release', `${api.replace(/\/$/,'')}/release`]
];
if (token) checks.push(['api-metrics', `${api.replace(/\/$/,'')}/metrics`]);
let failed=0;
for (const [name,url] of checks) {
  try {
    const response=await fetch(url,{headers:name==='api-metrics'?{authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(15000)});
    const body=await response.text();
    const ok=response.ok && (name==='web' || body.length>0);
    console.log(JSON.stringify({name,url,status:response.status,ok}));
    if(!ok) failed++;
  } catch(error) { failed++; console.log(JSON.stringify({name,url,ok:false,error:String(error)})); }
}
process.exit(failed?1:0);
