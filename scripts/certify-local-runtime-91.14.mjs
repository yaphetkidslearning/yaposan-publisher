const server=process.env.YAPOSAN_RUNTIME_BASE_URL||"http://127.0.0.1:4100";
const bg=process.env.BACKGROUND_REMOVAL_URL||"http://127.0.0.1:8090";
const web=process.env.YAPOSAN_WEB_URL||"http://127.0.0.1:8081";
async function probe(name,url){try{const r=await fetch(url,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);console.log(`PASS ${name}: ${url}`);return true}catch(e){console.error(`FAIL ${name}: ${url} - ${e.message}`);return false}}
const results=[];results.push(await probe("Yaposan API health",`${server}/health`));results.push(await probe("Background removal health",`${bg.replace(/\/$/,"")}/health`));results.push(await probe("Expo web",web));
console.log("\nInteractive acceptance still required: sign in, import a real image, remove background, test transparent/white/custom color, and verify at least one configured image provider tool.");
if(results.some(x=>!x))process.exit(1);
