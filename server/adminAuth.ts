import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { AdminPrincipalRecord, AdminRole, DatabaseAdapter } from "./database";
import { hashPassword, verifyPassword } from "./identity";

export type AdminPermission = "users"|"spaces"|"marketplace"|"ai_gpu"|"finance"|"infrastructure"|"moderation"|"audit"|"security"|"payouts";
export type AdminClaims = { aud:"yaposan-admin"; sub:string; sid:string; type:"admin_access"; exp:number };
const ROLE_PERMISSIONS:Record<AdminRole,AdminPermission[]>= {
  super_admin:["users","spaces","marketplace","ai_gpu","finance","infrastructure","moderation","audit","security","payouts"],
  support_admin:["users","spaces","audit"], marketplace_admin:["marketplace","moderation","audit"], operations_admin:["ai_gpu","infrastructure","audit"], finance_admin:["finance","payouts","audit"], security_admin:["security","audit"]
};
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
const sign=(payload:string,secret:string)=>createHmac("sha256",secret).update(`yaposan-admin:${payload}`).digest("base64url");
const safe=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const hashMeta=(value:string|undefined)=>value?createHash("sha256").update(value).digest("hex"):undefined;
export const publicAdmin=(p:AdminPrincipalRecord)=>({id:p.id,email:p.email,role:p.role,status:p.status,lastLoginAt:p.lastLoginAt,permissions:ROLE_PERMISSIONS[p.role]});
export function verifyAdminToken(token:string|undefined,secret:string){if(!token)return undefined;const raw=token.replace(/^Bearer\s+/i,"");const [payload,sig]=raw.split(".");if(!payload||!sig||!safe(sign(payload,secret),sig))return undefined;try{const claims=JSON.parse(Buffer.from(payload,"base64url").toString()) as AdminClaims;return claims.aud==="yaposan-admin"&&claims.type==="admin_access"&&claims.exp>Date.now()?claims:undefined}catch{return undefined}}
export async function authenticateAdmin(db:DatabaseAdapter,input:{email:string;password:string},config:{secret:string;bootstrapEmail?:string;bootstrapPassword?:string;sessionHours:number},meta:{ip?:string;userAgent?:string}={}){
 const email=input.email.trim().toLowerCase();let principal=(await db.find("adminPrincipals",p=>p.email===email))[0];
 if(!principal){
   const existing=await db.find("adminPrincipals",()=>true);
   const bootstrapMatches=Boolean(config.bootstrapEmail&&config.bootstrapPassword)&&email===config.bootstrapEmail&&safe(input.password,String(config.bootstrapPassword));
   if(existing.length===0&&bootstrapMatches){
     principal=await db.insert("adminPrincipals",{email,passwordHash:hashPassword(input.password),role:"super_admin",status:"active"});
   }else if(existing.length===1&&bootstrapMatches&&existing[0].role==="super_admin"){
     const previous=existing[0];
     principal=await db.update("adminPrincipals",previous.id,{email,passwordHash:hashPassword(input.password),status:"active"});
     for(const existingSession of await db.find("adminSessions",x=>x.principalId===previous.id&&!x.revokedAt))await db.update("adminSessions",existingSession.id,{revokedAt:new Date().toISOString()});
     await db.insert("adminAuditEvents",{principalId:principal.id,action:"admin.bootstrap.principal_migrated",target:principal.id,metadata:{previousEmail:previous.email,email}});
   }else throw new Error("ADMIN_INVALID_CREDENTIALS");
 }
 if(principal.status!=="active")throw new Error("ADMIN_INVALID_CREDENTIALS");
 if(!verifyPassword(input.password,principal.passwordHash)){
   const bootstrapMatches=config.bootstrapEmail===email&&Boolean(config.bootstrapPassword)&&safe(input.password,String(config.bootstrapPassword));
   if(!bootstrapMatches)throw new Error("ADMIN_INVALID_CREDENTIALS");
   principal=await db.update("adminPrincipals",principal.id,{passwordHash:hashPassword(input.password)});
   for(const existingSession of await db.find("adminSessions",x=>x.principalId===principal!.id&&!x.revokedAt))await db.update("adminSessions",existingSession.id,{revokedAt:new Date().toISOString()});
   await db.insert("adminAuditEvents",{principalId:principal.id,action:"admin.bootstrap.password_synced",target:principal.id});
 }
 const expiresAt=new Date(Date.now()+Math.max(1,config.sessionHours)*3600_000).toISOString();const session=await db.insert("adminSessions",{principalId:principal.id,expiresAt,ipHash:hashMeta(meta.ip),userAgentHash:hashMeta(meta.userAgent)});principal=await db.update("adminPrincipals",principal.id,{lastLoginAt:new Date().toISOString()});
 const claims:AdminClaims={aud:"yaposan-admin",sub:principal.id,sid:session.id,type:"admin_access",exp:Date.parse(expiresAt)};const payload=encode(claims);const token=`${payload}.${sign(payload,config.secret)}`;
 await db.insert("adminAuditEvents",{principalId:principal.id,action:"admin.auth.login",target:session.id});return {accessToken:token,expiresAt,admin:publicAdmin(principal)};
}
export async function requireAdmin(db:DatabaseAdapter,token:string|undefined,secret:string,permission?:AdminPermission){const claims=verifyAdminToken(token,secret);if(!claims)throw new Error("ADMIN_UNAUTHORIZED");const session=await db.get("adminSessions",claims.sid);const principal=await db.get("adminPrincipals",claims.sub);if(!session||session.principalId!==claims.sub||session.revokedAt||Date.parse(session.expiresAt)<=Date.now()||!principal||principal.status!=="active")throw new Error("ADMIN_UNAUTHORIZED");if(permission&&!ROLE_PERMISSIONS[principal.role].includes(permission))throw new Error("ADMIN_FORBIDDEN");return {claims,principal,session};}
export async function revokeAdminSession(db:DatabaseAdapter,token:string|undefined,secret:string){const auth=await requireAdmin(db,token,secret);await db.update("adminSessions",auth.session.id,{revokedAt:new Date().toISOString()});await db.insert("adminAuditEvents",{principalId:auth.principal.id,action:"admin.auth.logout",target:auth.session.id});return true;}

export async function listAdminPrincipals(db:DatabaseAdapter){return (await db.find("adminPrincipals",()=>true)).sort((a,b)=>a.email.localeCompare(b.email)).map(publicAdmin);}
export async function createAdminPrincipal(db:DatabaseAdapter,actor:AdminPrincipalRecord,input:{email:string;password:string;role:AdminRole}){if(actor.role!=="super_admin")throw new Error("ADMIN_FORBIDDEN");const email=input.email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||input.password.length<14)throw new Error("INVALID_ADMIN_PRINCIPAL");const roles:AdminRole[]=["super_admin","support_admin","marketplace_admin","operations_admin","finance_admin","security_admin"];if(!roles.includes(input.role))throw new Error("INVALID_ADMIN_ROLE");if((await db.find("adminPrincipals",p=>p.email===email)).length)throw new Error("ADMIN_PRINCIPAL_EXISTS");const principal=await db.insert("adminPrincipals",{email,passwordHash:hashPassword(input.password),role:input.role,status:"active"});await db.insert("adminAuditEvents",{principalId:actor.id,action:"admin.principal.created",target:principal.id,metadata:{email,role:input.role}});return publicAdmin(principal);}
export async function setAdminPrincipalStatus(db:DatabaseAdapter,actor:AdminPrincipalRecord,principalId:string,status:"active"|"disabled"){if(actor.role!=="super_admin")throw new Error("ADMIN_FORBIDDEN");if(actor.id===principalId&&status==="disabled")throw new Error("ADMIN_SELF_DISABLE_BLOCKED");const principal=await db.get("adminPrincipals",principalId);if(!principal)throw new Error("ADMIN_PRINCIPAL_NOT_FOUND");const updated=await db.update("adminPrincipals",principalId,{status});if(status==="disabled"){for(const session of await db.find("adminSessions",x=>x.principalId===principalId&&!x.revokedAt))await db.update("adminSessions",session.id,{revokedAt:new Date().toISOString()});}await db.insert("adminAuditEvents",{principalId:actor.id,action:"admin.principal.status",target:principalId,metadata:{status}});return publicAdmin(updated);}
