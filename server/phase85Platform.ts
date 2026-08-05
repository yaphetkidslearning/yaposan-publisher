import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type ApiScope = "projects:read" | "projects:write" | "exports:read" | "exports:create" | "ai:run" | "webhooks:manage";
export type PublicApiKeyRecord = { id:string; workspaceId:string; name:string; keyPrefix:string; secretHash:string; scopes:ApiScope[]; createdAt:string; lastUsedAt?:string; revokedAt?:string };
export type MobileDeviceRecord = { id:string; userId:string; platform:"ios"|"android"|"web"; deviceName:string; pushToken?:string; trusted:boolean; createdAt:string; lastSeenAt:string; revokedAt?:string };
export type WebhookSubscription = { id:string; workspaceId:string; url:string; secret:string; events:string[]; active:boolean; createdAt:string };
export type AiAutomationJob = { id:string; workspaceId:string; createdBy:string; name:string; prompt:string; schedule?:string; batchProjectIds:string[]; status:"queued"|"running"|"completed"|"failed"|"cancelled"; createdAt:string; updatedAt:string; error?:string };

const apiKeys=new Map<string,PublicApiKeyRecord>();
const devices=new Map<string,MobileDeviceRecord>();
const webhooks=new Map<string,WebhookSubscription>();
const jobs=new Map<string,AiAutomationJob>();
const now=()=>new Date().toISOString();
const makeId=(prefix:string)=>`${prefix}_${randomBytes(12).toString("hex")}`;
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");

export function createPublicApiKey(workspaceId:string,name:string,scopes:ApiScope[]){
  const secret=`ypk_${randomBytes(24).toString("base64url")}`;
  const record:PublicApiKeyRecord={id:makeId("key"),workspaceId,name:name.trim()||"API key",keyPrefix:secret.slice(0,12),secretHash:hash(secret),scopes:[...new Set(scopes)],createdAt:now()};
  apiKeys.set(record.id,record); return {record,secret};
}
export const listPublicApiKeys=(workspaceId:string)=>[...apiKeys.values()].filter(k=>k.workspaceId===workspaceId);
export function revokePublicApiKey(workspaceId:string,keyId:string){const k=apiKeys.get(keyId);if(!k||k.workspaceId!==workspaceId)return false;k.revokedAt=now();return true;}
export function authenticatePublicApiKey(secret:string,requiredScope?:ApiScope){
  const digest=hash(secret); const record=[...apiKeys.values()].find(candidate=>{const a=Buffer.from(candidate.secretHash);const b=Buffer.from(digest);return !candidate.revokedAt&&a.length===b.length&&timingSafeEqual(a,b)});
  if(!record||(requiredScope&&!record.scopes.includes(requiredScope)))return undefined; record.lastUsedAt=now(); return record;
}
export function registerMobileDevice(input:Omit<MobileDeviceRecord,"id"|"createdAt"|"lastSeenAt"|"trusted">){const record:MobileDeviceRecord={...input,id:makeId("device"),trusted:false,createdAt:now(),lastSeenAt:now()};devices.set(record.id,record);return record;}
export const listMobileDevices=(userId:string)=>[...devices.values()].filter(d=>d.userId===userId);
export function setMobileDeviceTrust(userId:string,deviceId:string,trusted:boolean){const d=devices.get(deviceId);if(!d||d.userId!==userId||d.revokedAt)return false;d.trusted=trusted;d.lastSeenAt=now();return true;}
export function revokeMobileDevice(userId:string,deviceId:string){const d=devices.get(deviceId);if(!d||d.userId!==userId)return false;d.revokedAt=now();return true;}
export function createWebhook(workspaceId:string,url:string,events:string[]){const record:WebhookSubscription={id:makeId("webhook"),workspaceId,url,secret:`whsec_${randomBytes(24).toString("base64url")}`,events:[...new Set(events)],active:true,createdAt:now()};webhooks.set(record.id,record);return record;}
export const listWebhooks=(workspaceId:string)=>[...webhooks.values()].filter(w=>w.workspaceId===workspaceId);
export function signWebhookPayload(secret:string,payload:string,timestamp=Math.floor(Date.now()/1000)){const signature=createHmac("sha256",secret).update(`${timestamp}.${payload}`).digest("hex");return `t=${timestamp},v1=${signature}`;}
export function enqueueAiAutomation(input:Omit<AiAutomationJob,"id"|"status"|"createdAt"|"updatedAt">){const timestamp=now();const job:AiAutomationJob={...input,id:makeId("aijob"),status:"queued",createdAt:timestamp,updatedAt:timestamp};jobs.set(job.id,job);return job;}
export const listAiAutomations=(workspaceId:string)=>[...jobs.values()].filter(j=>j.workspaceId===workspaceId);
export function cancelAiAutomation(workspaceId:string,jobId:string){const j=jobs.get(jobId);if(!j||j.workspaceId!==workspaceId||["completed","failed"].includes(j.status))return false;j.status="cancelled";j.updatedAt=now();return true;}
