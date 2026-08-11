const base=(process.env.YAPOSAN_PRODUCTION_URL||'').replace(/\/$/,'');
const api=(process.env.YAPOSAN_API_URL||'').replace(/\/$/,'');
if(!base)throw new Error('Set YAPOSAN_PRODUCTION_URL=https://your-production-domain before running verify:production');
if(!base.startsWith('https://'))throw new Error('Production URL must use HTTPS');
const timeoutMs=Number(process.env.PRODUCTION_VERIFY_TIMEOUT_MS||10000);
async function get(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);try{return await fetch(url,{redirect:'manual',signal:c.signal,headers:{'user-agent':'Yaposan-Phase90.11-ReadOnly-Smoke/1.0'}})}finally{clearTimeout(t)}}
const home=await get(base+'/');
if(home.status>=400)throw new Error(`Home failed: HTTP ${home.status}`);
if(home.status>=300&&home.status<400)throw new Error(`Unexpected home redirect: ${home.headers.get('location')}`);
const html=await home.text();
if(!/<title>[^<]*Yaposan[^<]*<\/title>/i.test(html))throw new Error('Production HTML does not contain a Yaposan title');
if(!/<link[^>]+rel=["']canonical["']/i.test(html))console.warn('WARN: canonical link not detected in server response');
if(/(?:localhost|127\.0\.0\.1):\d+/i.test(html))throw new Error('Production HTML contains a localhost reference');
for(const p of ['/robots.txt','/sitemap.xml']){const r=await get(base+p);if(r.status!==200)throw new Error(`${p} failed: HTTP ${r.status}`);const body=await r.text();if(body.trim().length<5)throw new Error(`${p} is unexpectedly empty`)}
if(api){if(!api.startsWith('https://'))throw new Error('YAPOSAN_API_URL must use HTTPS');const healthPath=process.env.YAPOSAN_API_HEALTH_PATH||'/health';const r=await get(api+healthPath);if(r.status>=400)throw new Error(`API health failed: HTTP ${r.status}`)}
console.log('Phase 90.11 read-only production smoke checks passed.');
