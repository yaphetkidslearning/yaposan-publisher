import { readLocalDevToken } from "./local-dev-token";
import { stdin, stdout } from "node:process";
const stdinMode=process.argv.includes("--stdin");
let pipedPasswords:string[]|undefined;
const email=String(process.argv[2]??"").trim().toLowerCase();
const api=String(process.env.EXPO_PUBLIC_API_URL??process.env.PUBLIC_API_URL??"http://localhost:4100").replace(/\/$/,"");
function local(v:string){try{return ["localhost","127.0.0.1","::1"].includes(new URL(v).hostname.toLowerCase())}catch{return false}}
async function hidden(prompt:string){
 if(!stdin.isTTY){
  if(!stdinMode)throw new Error("An interactive terminal is required so the password is not placed on the command line.");
  if(!pipedPasswords){let text="";stdin.setEncoding("utf8");for await(const chunk of stdin)text+=chunk;pipedPasswords=text.split(/\r?\n/)}
  const value=pipedPasswords.shift()??"";if(!value)throw new Error("Password input is required.");return value;
 }
 stdout.write(prompt);stdin.setRawMode?.(true);stdin.resume();stdin.setEncoding("utf8");let value="";
 return await new Promise<string>((resolve,reject)=>{const onData=(chunk:string)=>{for(const ch of chunk){if(ch==="\u0003"){cleanup();reject(new Error("Cancelled"));return}if(ch==="\r"||ch==="\n"){stdout.write("\n");cleanup();resolve(value);return}if(ch==="\u007f"||ch==="\b"){if(value){value=value.slice(0,-1);stdout.write("\b \b")}continue}value+=ch;stdout.write("*")}};const cleanup=()=>{stdin.off("data",onData);stdin.setRawMode?.(false);stdin.pause()};stdin.on("data",onData)});
}
async function main(){
 if(String(process.env.NODE_ENV??"development").toLowerCase()==="production"||!local(api)){console.error("Refusing local password recovery outside localhost development.");process.exitCode=2;return}
 if(!/^\S+@\S+\.\S+$/.test(email)){console.error("Usage: npm run user:password -- user@example.com");process.exitCode=2;return}
 const first=await hidden("New customer password: ");const second=await hidden("Confirm new customer password: ");if(first!==second)throw new Error("Passwords do not match.");
 const localDevToken=await readLocalDevToken();
 const r=await fetch(`${api}/api/v1/dev/local-user-password`,{method:"POST",headers:{"content-type":"application/json","x-yaposan-local-dev":localDevToken},body:JSON.stringify({email,newPassword:first})});const body:any=await r.json().catch(()=>({}));if(!r.ok){const details=Array.isArray(body?.error?.details)?`: ${body.error.details.join("; ")}`:"";throw new Error(String(body?.error?.message??`HTTP ${r.status}`)+details)}
 console.log(`Local password reset completed for ${email}. Revoked sessions: ${Number(body.revokedSessions??0)}.`);
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1});
