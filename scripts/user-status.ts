import { readLocalDevToken } from "./local-dev-token";
const email=String(process.argv[2]??"").trim().toLowerCase();
const api=String(process.env.EXPO_PUBLIC_API_URL??process.env.PUBLIC_API_URL??"http://localhost:4100").replace(/\/$/,"");
function local(v:string){try{return ["localhost","127.0.0.1","::1"].includes(new URL(v).hostname.toLowerCase())}catch{return false}}
async function main(){
 if(String(process.env.NODE_ENV??"development").toLowerCase()==="production"||!local(api)){console.error("Refusing local customer diagnostics outside localhost development.");process.exitCode=2;return}
 if(!/^\S+@\S+\.\S+$/.test(email)){console.error("Usage: npm run user:status -- user@example.com");process.exitCode=2;return}
 const localDevToken=await readLocalDevToken();
 const r=await fetch(`${api}/api/v1/dev/local-user-status`,{method:"POST",headers:{"content-type":"application/json","x-yaposan-local-dev":localDevToken},body:JSON.stringify({email})});
 const body:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error(String(body?.error?.message??`HTTP ${r.status}`));
 console.log(JSON.stringify(body,null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));console.error(`Make sure npm run web is running at ${api}.`);process.exitCode=1});
