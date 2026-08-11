import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { DatabaseAdapter } from "./database";
import { assertSafeProviderEndpoint, fetchJsonLimited } from "./aiNetworkSecurity.ts";

function decodeKey(raw:string){
  let buf:Buffer;
  try{buf=Buffer.from(raw,"base64")}catch{buf=Buffer.alloc(0)}
  if(buf.length!==32&&/^[0-9a-f]{64}$/i.test(raw))buf=Buffer.from(raw,"hex");
  if(buf.length!==32)throw new Error("AI_CREDENTIAL_ENCRYPTION_KEY_INVALID");
  return buf;
}
function currentKeyVersion(){return (process.env.AI_CREDENTIAL_ENCRYPTION_KEY_VERSION??"1").trim()||"1"}
function aad(organizationId:string,provider:string){return Buffer.from(`yaposan-ai-provider:${organizationId}:${provider.toLowerCase()}`,"utf8")}
function keyMap(){
  const map=new Map<string,Buffer>();
  map.set(currentKeyVersion(),decodeKey(process.env.AI_CREDENTIAL_ENCRYPTION_KEY??""));
  const json=process.env.AI_CREDENTIAL_ENCRYPTION_KEYS_PREVIOUS_JSON?.trim();
  if(json){
    try{const parsed=JSON.parse(json) as Record<string,string>;for(const [version,raw] of Object.entries(parsed))map.set(version,decodeKey(raw))}catch(error){if(error instanceof SyntaxError)throw new Error("AI_CREDENTIAL_PREVIOUS_KEYS_JSON_INVALID");throw error}
  }
  for(const [index,raw] of (process.env.AI_CREDENTIAL_ENCRYPTION_KEY_PREVIOUS??"").split(",").map(x=>x.trim()).filter(Boolean).entries()){
    try{map.set(`legacy-${index+1}`,decodeKey(raw))}catch{}
  }
  return map;
}
function seal(value:string,organizationId:string,provider:string){
  const version=currentKeyVersion();const key=keyMap().get(version);if(!key)throw new Error("AI_CREDENTIAL_ENCRYPTION_KEY_INVALID");
  const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);cipher.setAAD(aad(organizationId,provider));
  const enc=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);const tag=cipher.getAuthTag();
  return {ciphertext:`v3:${version}:${Buffer.concat([iv,tag,enc]).toString("base64")}`,keyVersion:version};
}
function open(value:string,organizationId:string,provider:string,storedVersion?:string){
  if(value.startsWith("v3:")){
    const first=value.indexOf(":",3);if(first<0)throw new Error("AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED");
    const version=value.slice(3,first);const encoded=value.slice(first+1);if(storedVersion&&storedVersion!==version)throw new Error("AI_PROVIDER_CREDENTIAL_KEY_VERSION_MISMATCH");
    const key=keyMap().get(version);if(!key)throw new Error("AI_PROVIDER_CREDENTIAL_KEY_VERSION_UNAVAILABLE");
    const data=Buffer.from(encoded,"base64");if(data.length<29)throw new Error("AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED");
    const iv=data.subarray(0,12),tag=data.subarray(12,28),enc=data.subarray(28);
    try{const decipher=createDecipheriv("aes-256-gcm",key,iv);decipher.setAAD(aad(organizationId,provider));decipher.setAuthTag(tag);return Buffer.concat([decipher.update(enc),decipher.final()]).toString("utf8")}catch{throw new Error("AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED")}
  }
  // Backward-compatible Phase 90.7/90.8 ciphertext migration path. Re-save/rotate upgrades it to v3 + AAD.
  const encoded=value.startsWith("v2:")?value.slice(3):value;const data=Buffer.from(encoded,"base64");if(data.length<29)throw new Error("AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED");
  const iv=data.subarray(0,12),tag=data.subarray(12,28),enc=data.subarray(28);
  for(const key of keyMap().values())try{const decipher=createDecipheriv("aes-256-gcm",key,iv);decipher.setAuthTag(tag);return Buffer.concat([decipher.update(enc),decipher.final()]).toString("utf8")}catch{}
  throw new Error("AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED");
}

async function audit(db:DatabaseAdapter,args:{organizationId:string;actorUserId?:string;action:string;provider:string;metadata?:Record<string,unknown>}){
  await db.insert("auditEvents",{organizationId:args.organizationId,actorUserId:args.actorUserId,action:args.action,target:`ai-provider:${args.provider}`,metadata:args.metadata});
}

const DEFAULT_ENDPOINTS:Record<string,string>={
  openai:"https://api.openai.com/v1/chat/completions",
  gemini:"https://generativelanguage.googleapis.com/v1beta/models",
  claude:"https://api.anthropic.com/v1/messages",
  anthropic:"https://api.anthropic.com/v1/messages",
  ollama:"http://127.0.0.1:11434/v1/chat/completions",
  lmstudio:"http://127.0.0.1:1234/v1/chat/completions"
};
export async function saveProviderCredential(db:DatabaseAdapter,args:{organizationId:string;actorUserId?:string;provider:string;apiKey:string;endpoint?:string;model?:string}){
  const provider=args.provider.trim().toLowerCase();const apiKey=args.apiKey.trim();
  if(!provider||(!apiKey&&!( ["ollama","lmstudio"].includes(provider))))throw new Error("INVALID_PROVIDER_CREDENTIAL");
  const endpoint=args.endpoint?.trim()||DEFAULT_ENDPOINTS[provider];if(!endpoint)throw new Error("AI_PROVIDER_ENDPOINT_REQUIRED");
  await assertSafeProviderEndpoint(provider,endpoint,{resolveDns:false});
  const existing=(await db.find("aiProviderCredentials",x=>x.organizationId===args.organizationId&&x.provider===provider))[0];
  const sealed=seal(apiKey,args.organizationId,provider);
  const patch={provider,endpoint,model:args.model?.trim()||undefined,encryptedApiKey:sealed.ciphertext,keyLast4:apiKey.slice(-4),keyVersion:sealed.keyVersion};
  const saved=existing?await db.update("aiProviderCredentials",existing.id,patch):await db.insert("aiProviderCredentials",{organizationId:args.organizationId,...patch});
  await audit(db,{organizationId:args.organizationId,actorUserId:args.actorUserId,action:existing?"ai.provider.updated":"ai.provider.connected",provider,metadata:{endpoint,model:patch.model,keyLast4:patch.keyLast4,keyVersion:sealed.keyVersion}});
  return saved;
}
export async function listProviderCredentials(db:DatabaseAdapter,organizationId:string){
  const rows=await db.find("aiProviderCredentials",x=>x.organizationId===organizationId);return rows.map(({encryptedApiKey,...x})=>x);
}
export async function loadProviderCredential(db:DatabaseAdapter,organizationId:string,provider:string){
  const normalized=provider.trim().toLowerCase();const row=(await db.find("aiProviderCredentials",x=>x.organizationId===organizationId&&x.provider===normalized))[0];return row?{...row,apiKey:open(row.encryptedApiKey,organizationId,normalized,row.keyVersion)}:undefined;
}
export async function deleteProviderCredential(db:DatabaseAdapter,organizationId:string,provider:string,actorUserId?:string){
  const normalized=provider.trim().toLowerCase();const row=(await db.find("aiProviderCredentials",x=>x.organizationId===organizationId&&x.provider===normalized))[0];
  const deleted=row?await db.delete("aiProviderCredentials",row.id):false;if(deleted)await audit(db,{organizationId,actorUserId,action:"ai.provider.deleted",provider:normalized});return deleted;
}
export async function rotateProviderCredentials(db:DatabaseAdapter,organizationId:string,actorUserId?:string){
  const rows=await db.find("aiProviderCredentials",x=>x.organizationId===organizationId);let rotated=0;
  for(const row of rows){const plain=open(row.encryptedApiKey,organizationId,row.provider,row.keyVersion);const sealed=seal(plain,organizationId,row.provider);await db.update("aiProviderCredentials",row.id,{encryptedApiKey:sealed.ciphertext,keyLast4:plain.slice(-4),keyVersion:sealed.keyVersion});rotated++}
  await audit(db,{organizationId,actorUserId,action:"ai.provider.key_rotated",provider:"*",metadata:{rotated,keyVersion:currentKeyVersion()}});return rotated;
}
function testUrl(provider:string,endpoint:string){
  const u=new URL(endpoint);const p=provider.toLowerCase();
  if(p==="ollama"){u.pathname="/api/tags";u.search="";return u.toString()}
  if(p==="lmstudio"){u.pathname="/v1/models";u.search="";return u.toString()}
  if(p==="gemini"){u.pathname="/v1beta/models";u.search="";return u.toString()}
  if(p==="claude"||p==="anthropic"){u.pathname="/v1/models";u.search="";return u.toString()}
  u.pathname=u.pathname.replace(/\/chat\/completions\/?$/,"/models").replace(/\/responses\/?$/,"/models");return u.toString();
}
export async function testProviderCredential(db:DatabaseAdapter,organizationId:string,provider:string,actorUserId?:string){
  const cred=await loadProviderCredential(db,organizationId,provider);if(!cred)throw new Error("AI_PROVIDER_CREDENTIAL_NOT_FOUND");
  const headers:Record<string,string>={};const p=cred.provider.toLowerCase();
  if(cred.apiKey){if(p==="gemini")headers["x-goog-api-key"]=cred.apiKey;else if(p==="claude"||p==="anthropic"){headers["x-api-key"]=cred.apiKey;headers["anthropic-version"]="2023-06-01"}else headers.authorization=`Bearer ${cred.apiKey}`;}
  const {response}=await fetchJsonLimited(testUrl(p,cred.endpoint??""),{method:"GET",headers},{provider:p,timeoutMs:10000,maxBytes:262144});
  if(response.status===401||response.status===403)throw new Error("AI_PROVIDER_AUTHENTICATION_FAILED");if(response.status>=500)throw new Error(`AI_PROVIDER_${response.status}`);
  await audit(db,{organizationId,actorUserId,action:"ai.provider.tested",provider:p,metadata:{status:response.status}});return {ok:true,status:response.status,provider:p,endpoint:cred.endpoint,model:cred.model};
}

// Exported only for focused security regression tests; never exposed through an API route.
export const __providerVaultTest={seal,open,aad,currentKeyVersion};
