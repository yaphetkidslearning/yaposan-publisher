import { createHash, randomUUID } from "node:crypto";
import type { DatabaseAdapter, SpaceSecuritySettingsRecord, UserSessionRecord } from "./database";
import { requireSpaceAccess } from "./spaces";
import type { SessionClaims } from "./identity";

export type AuthAssurance = "password"|"mfa"|"passkey"|"oidc";

const hashMeta = (value?: string) => value ? createHash("sha256").update(value).digest("hex") : undefined;
const normalizeAssurance = (value?: string):AuthAssurance => value === "passkey" ? "passkey" : value === "mfa" ? "mfa" : value === "oidc" ? "oidc" : "password";

export async function createUserSession(db:DatabaseAdapter,userId:string,input:{sessionId?:string;ip?:string;userAgent?:string;authMethod?:string;assurance?:string;refreshDays:number}){
  const existing=input.sessionId?(await db.get("userSessions",input.sessionId)):undefined;
  if(existing)return existing;
  return db.insert("userSessions",{
    id:input.sessionId??randomUUID(),userId,version:1,authMethod:input.authMethod??"local_password",assurance:normalizeAssurance(input.assurance),
    expiresAt:new Date(Date.now()+Math.max(1,input.refreshDays)*86_400_000).toISOString(),lastSeenAt:new Date().toISOString(),ipHash:hashMeta(input.ip),userAgentHash:hashMeta(input.userAgent),
  });
}


export async function getOrCreateExternalSession(db:DatabaseAdapter,userId:string,input:{externalSessionKey:string;ip?:string;userAgent?:string;assurance?:string;expiresAt:string}){
 const existing=(await db.find("userSessions",x=>x.userId===userId&&x.externalSessionKey===input.externalSessionKey&&!x.revokedAt))[0];if(existing){if(new Date(existing.expiresAt).getTime()<=Date.now())return db.update("userSessions",existing.id,{expiresAt:input.expiresAt,lastSeenAt:new Date().toISOString(),version:existing.version+1,assurance:normalizeAssurance(input.assurance)});return existing}
 return db.insert("userSessions",{userId,version:1,authMethod:"oidc",assurance:normalizeAssurance(input.assurance),externalSessionKey:input.externalSessionKey,expiresAt:input.expiresAt,lastSeenAt:new Date().toISOString(),ipHash:hashMeta(input.ip),userAgentHash:hashMeta(input.userAgent)});
}

export async function requireActiveUserSession(db:DatabaseAdapter,claims:SessionClaims){
  const session=await db.get("userSessions",claims.sid);
  if(!session||session.userId!==claims.sub||session.revokedAt||new Date(session.expiresAt).getTime()<=Date.now())throw new Error("SESSION_REVOKED");
  if(typeof claims.ver==="number"&&session.version!==claims.ver)throw new Error("SESSION_ROTATED");
  if(Date.now()-new Date(session.lastSeenAt).getTime()>60_000)await db.update("userSessions",session.id,{lastSeenAt:new Date().toISOString()});
  return session;
}

export async function rotateUserSession(db:DatabaseAdapter,claims:SessionClaims){
  const session=await requireActiveUserSession(db,claims);
  return db.update("userSessions",session.id,{version:session.version+1,lastSeenAt:new Date().toISOString()});
}

export async function listUserSessions(db:DatabaseAdapter,userId:string,currentSessionId?:string){
  const rows=(await db.find("userSessions",x=>x.userId===userId&&!x.revokedAt&&new Date(x.expiresAt).getTime()>Date.now())).sort((a,b)=>b.lastSeenAt.localeCompare(a.lastSeenAt));
  return rows.map(x=>({id:x.id,current:x.id===currentSessionId,authMethod:x.authMethod,assurance:x.assurance,createdAt:x.createdAt,lastSeenAt:x.lastSeenAt,expiresAt:x.expiresAt,deviceFingerprint:x.userAgentHash?.slice(0,12),networkFingerprint:x.ipHash?.slice(0,12)}));
}

export async function revokeUserSession(db:DatabaseAdapter,userId:string,sessionId:string){
  const row=await db.get("userSessions",sessionId);if(!row||row.userId!==userId)throw new Error("SESSION_NOT_FOUND");
  if(row.revokedAt)return row;return db.update("userSessions",row.id,{revokedAt:new Date().toISOString(),version:row.version+1});
}

export async function revokeOtherSessions(db:DatabaseAdapter,userId:string,currentSessionId:string){
  const rows=await db.find("userSessions",x=>x.userId===userId&&x.id!==currentSessionId&&!x.revokedAt);let count=0;
  for(const row of rows){await db.update("userSessions",row.id,{revokedAt:new Date().toISOString(),version:row.version+1});count++}return count;
}

export async function getOrCreateSpaceSecurity(db:DatabaseAdapter,spaceId:string):Promise<SpaceSecuritySettingsRecord>{
  const existing=(await db.find("spaceSecuritySettings",x=>x.spaceId===spaceId))[0];if(existing)return existing;
  return db.insert("spaceSecuritySettings",{spaceId,requireStepUpForPublicSharing:true,requireStepUpForTeamAdmin:false,allowPublicComments:false,allowExternalConnections:false,allowFileDownloads:false,invitePolicy:"admins_only",uploadPolicy:"strict",securityAlerts:true});
}

export async function getSpaceSecurity(db:DatabaseAdapter,userId:string,spaceId:string){await requireSpaceAccess(db,userId,spaceId,"viewer");return getOrCreateSpaceSecurity(db,spaceId)}

export async function updateSpaceSecurity(db:DatabaseAdapter,userId:string,spaceId:string,patch:any){
  const space=await requireSpaceAccess(db,userId,spaceId,"admin");const current=await getOrCreateSpaceSecurity(db,spaceId);
  const next=await db.update("spaceSecuritySettings",current.id,{
    requireStepUpForPublicSharing:typeof patch.requireStepUpForPublicSharing==="boolean"?patch.requireStepUpForPublicSharing:current.requireStepUpForPublicSharing,
    requireStepUpForTeamAdmin:typeof patch.requireStepUpForTeamAdmin==="boolean"?patch.requireStepUpForTeamAdmin:current.requireStepUpForTeamAdmin,
    allowPublicComments:typeof patch.allowPublicComments==="boolean"?patch.allowPublicComments:current.allowPublicComments,
    allowExternalConnections:typeof patch.allowExternalConnections==="boolean"?patch.allowExternalConnections:current.allowExternalConnections,
    allowFileDownloads:typeof patch.allowFileDownloads==="boolean"?patch.allowFileDownloads:current.allowFileDownloads,
    securityAlerts:typeof patch.securityAlerts==="boolean"?patch.securityAlerts:current.securityAlerts,
    invitePolicy:["owner_only","admins_only"].includes(String(patch.invitePolicy))?patch.invitePolicy:current.invitePolicy,
    uploadPolicy:["strict","standard"].includes(String(patch.uploadPolicy))?patch.uploadPolicy:current.uploadPolicy,
  });
  await db.insert("auditEvents",{organizationId:space.organizationId,actorUserId:userId,action:"space.security.updated",target:spaceId,metadata:{...next,id:undefined,spaceId:undefined}});return next;
}

export async function requireSpaceSensitiveAction(db:DatabaseAdapter,spaceId:string,claims:SessionClaims,action:"public_share"|"team_admin"|"external_connection"){
  const policy=await getOrCreateSpaceSecurity(db,spaceId);const assurance=(claims.amr??"password") as AuthAssurance;
  const steppedUp=assurance==="mfa"||assurance==="passkey";
  if(action==="public_share"&&policy.requireStepUpForPublicSharing&&!steppedUp)throw new Error("STEP_UP_REQUIRED");
  if(action==="team_admin"&&policy.requireStepUpForTeamAdmin&&!steppedUp)throw new Error("STEP_UP_REQUIRED");
  if(action==="external_connection"&&!policy.allowExternalConnections)throw new Error("EXTERNAL_CONNECTIONS_DISABLED");
  return policy;
}

export function securityEventPayload(input:{type:string;severity?:"info"|"low"|"medium"|"high"|"critical";userId?:string;spaceId?:string;requestId?:string;ip?:string;metadata?:Record<string,unknown>}){
  return {schema:"yaposan.security.v1",timestamp:new Date().toISOString(),type:input.type,severity:input.severity??"info",userId:input.userId,spaceId:input.spaceId,requestId:input.requestId,ipHash:hashMeta(input.ip),metadata:input.metadata??{}};
}
