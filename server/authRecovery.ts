import { createHash, randomBytes } from "node:crypto";
import type { AdminPrincipalRecord, AuthTokenRecord, DatabaseAdapter, UserRecord } from "./database";
import { sendEmail } from "./email";
import { hashPassword, verifyPassword } from "./identity";
import { passwordPolicy } from "./securityPlatform";

const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
const nowIso=()=>new Date().toISOString();
const publicWebUrl=()=>String(process.env.PUBLIC_WEB_URL??process.env.PUBLIC_APP_URL??process.env.APP_URL??"http://localhost:8081").replace(/\/$/,"");

async function revokeOutstanding(db:DatabaseAdapter,subjectType:AuthTokenRecord["subjectType"],subjectId:string,purpose:AuthTokenRecord["purpose"]){
  for(const row of await db.find("authTokens",x=>x.subjectType===subjectType&&x.subjectId===subjectId&&x.purpose===purpose&&!x.usedAt))await db.update("authTokens",row.id,{usedAt:nowIso()});
}

export async function issueAuthToken(db:DatabaseAdapter,input:{subjectType:AuthTokenRecord["subjectType"];subjectId:string;email:string;purpose:AuthTokenRecord["purpose"];ttlMinutes:number}){
  await revokeOutstanding(db,input.subjectType,input.subjectId,input.purpose);
  const token=randomBytes(32).toString("base64url");
  const record=await db.insert("authTokens",{subjectType:input.subjectType,subjectId:input.subjectId,email:input.email.trim().toLowerCase(),purpose:input.purpose,tokenHash:tokenHash(token),expiresAt:new Date(Date.now()+Math.max(5,input.ttlMinutes)*60_000).toISOString()});
  return {token,record};
}

async function readValidToken(db:DatabaseAdapter,rawToken:string,purpose:AuthTokenRecord["purpose"]){
  const hash=tokenHash(rawToken.trim());
  const row=(await db.find("authTokens",x=>x.tokenHash===hash&&x.purpose===purpose))[0];
  if(!row||row.usedAt||Date.parse(row.expiresAt)<=Date.now())throw new Error("TOKEN_INVALID_OR_EXPIRED");
  return row;
}
async function consumeToken(db:DatabaseAdapter,rawToken:string,purpose:AuthTokenRecord["purpose"]){const row=await readValidToken(db,rawToken,purpose);await db.update("authTokens",row.id,{usedAt:nowIso()});return row;}

async function deliver(to:string,subject:string,html:string,text:string){
  try{await sendEmail({to,subject,html,text});return {sent:true as const}}catch(error){
    if(process.env.NODE_ENV==="production")throw error;
    return {sent:false as const,reason:error instanceof Error?error.message:"EMAIL_DELIVERY_FAILED"};
  }
}
async function notifySecurityChange(to:string,subject:string,message:string){
  try{await sendEmail({to,subject,html:`<p>${message}</p><p>If you did not make this change, secure your account and contact Yaposan support immediately.</p>`,text:`${message}
If you did not make this change, secure your account and contact Yaposan support immediately.`});return true}catch(error){console.warn(JSON.stringify({level:"warn",event:"security_email_delivery_failed",reason:error instanceof Error?error.message:"EMAIL_DELIVERY_FAILED"}));return false}
}

export async function sendVerificationEmail(db:DatabaseAdapter,user:UserRecord){
  if(user.emailVerified)return {sent:false as const,alreadyVerified:true as const};
  const {token}=await issueAuthToken(db,{subjectType:"user",subjectId:user.id,email:user.email,purpose:"email_verification",ttlMinutes:60*24});
  const url=`${publicWebUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const delivery=await deliver(user.email,"Verify your Yaposan account",`<p>Verify your Yaposan account by opening this secure link:</p><p><a href="${url}">Verify Email</a></p><p>This link expires in 24 hours and can only be used once.</p>`,`Verify your Yaposan account: ${url}\nThis link expires in 24 hours and can only be used once.`);
  return {...delivery,...(process.env.NODE_ENV!=="production"?{verificationUrl:url}:{})};
}

export async function verifyEmailToken(db:DatabaseAdapter,token:string){
  const row=await consumeToken(db,token,"email_verification");
  if(row.subjectType!=="user")throw new Error("TOKEN_INVALID_OR_EXPIRED");
  const user=await db.get("users",row.subjectId);if(!user)throw new Error("TOKEN_INVALID_OR_EXPIRED");
  if(!user.emailVerified||!user.emailVerifiedAt)await db.update("users",user.id,{emailVerified:true,emailVerifiedAt:user.emailVerifiedAt??nowIso()});
  return {verified:true,user:await db.get("users",user.id)};
}

export async function requestPasswordReset(db:DatabaseAdapter,emailInput:string){
  const email=emailInput.trim().toLowerCase();
  const user=(await db.find("users",u=>u.email.toLowerCase()===email&&u.identityProvider!=="oidc"))[0];
  if(!user)return {accepted:true};
  const {token}=await issueAuthToken(db,{subjectType:"user",subjectId:user.id,email:user.email,purpose:"password_reset",ttlMinutes:30});
  const url=`${publicWebUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const delivery=await deliver(user.email,"Reset your Yaposan password",`<p>A password reset was requested for your Yaposan account.</p><p><a href="${url}">Reset Password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request it, ignore this email.</p>`,`Reset your Yaposan password: ${url}\nThis link expires in 30 minutes and can only be used once.`);
  return {accepted:true,...delivery,...(process.env.NODE_ENV!=="production"?{resetUrl:url}:{})};
}

export async function resetPasswordWithToken(db:DatabaseAdapter,token:string,newPassword:string,confirmPassword:string){
  if(newPassword!==confirmPassword)throw new Error("PASSWORD_CONFIRMATION_MISMATCH");
  const row=await readValidToken(db,token,"password_reset");
  if(row.subjectType!=="user")throw new Error("TOKEN_INVALID_OR_EXPIRED");
  const user=await db.get("users",row.subjectId);if(!user)throw new Error("TOKEN_INVALID_OR_EXPIRED");
  const check=passwordPolicy(newPassword,user.email);if(!check.valid)throw new Error(`PASSWORD_POLICY:${check.issues.join(" ")}`);
  await db.update("authTokens",row.id,{usedAt:nowIso()});
  await db.update("users",user.id,{passwordHash:hashPassword(newPassword)});
  for(const session of await db.find("userSessions",x=>x.userId===user.id&&!x.revokedAt))await db.update("userSessions",session.id,{revokedAt:nowIso()});
  await db.insert("auditEvents",{actorUserId:user.id,action:"user.password.reset",target:user.id});
  void notifySecurityChange(user.email,"Your Yaposan password was reset","Your Yaposan password was reset and existing sessions were signed out.");
  return {reset:true};
}

export async function changePassword(db:DatabaseAdapter,userId:string,currentPassword:string,newPassword:string,confirmPassword:string){
  const user=await db.get("users",userId);if(!user||user.identityProvider==="oidc")throw new Error("PASSWORD_CHANGE_UNAVAILABLE");
  if(!verifyPassword(currentPassword,user.passwordHash))throw new Error("CURRENT_PASSWORD_INVALID");
  if(newPassword!==confirmPassword)throw new Error("PASSWORD_CONFIRMATION_MISMATCH");
  const check=passwordPolicy(newPassword,user.email);if(!check.valid)throw new Error(`PASSWORD_POLICY:${check.issues.join(" ")}`);
  if(verifyPassword(newPassword,user.passwordHash))throw new Error("PASSWORD_REUSE_NOT_ALLOWED");
  await db.update("users",user.id,{passwordHash:hashPassword(newPassword)});
  for(const session of await db.find("userSessions",x=>x.userId===user.id&&!x.revokedAt))await db.update("userSessions",session.id,{revokedAt:nowIso()});
  await db.insert("auditEvents",{actorUserId:user.id,action:"user.password.changed",target:user.id});
  void notifySecurityChange(user.email,"Your Yaposan password was changed","Your Yaposan password was changed and existing sessions were signed out.");
  return {changed:true,sessionsRevoked:true};
}

export async function requestAdminPasswordReset(db:DatabaseAdapter,emailInput:string){
  const email=emailInput.trim().toLowerCase();const admin=(await db.find("adminPrincipals",a=>a.email===email&&a.status==="active"))[0];if(!admin)return {accepted:true};
  const {token}=await issueAuthToken(db,{subjectType:"admin",subjectId:admin.id,email:admin.email,purpose:"admin_password_reset",ttlMinutes:20});
  const url=`${publicWebUrl()}/yaposan-admin-reset?token=${encodeURIComponent(token)}`;
  const delivery=await deliver(admin.email,"Reset your Yaposan Admin password",`<p>A Yaposan Admin password reset was requested.</p><p><a href="${url}">Reset Admin Password</a></p><p>This single-use link expires in 20 minutes.</p>`,`Reset your Yaposan Admin password: ${url}\nThis single-use link expires in 20 minutes.`);
  return {accepted:true,...delivery,...(process.env.NODE_ENV!=="production"?{resetUrl:url}:{})};
}

export async function resetAdminPasswordWithToken(db:DatabaseAdapter,token:string,newPassword:string,confirmPassword:string){
  if(newPassword!==confirmPassword)throw new Error("PASSWORD_CONFIRMATION_MISMATCH");
  if(newPassword.length<14)throw new Error("ADMIN_PASSWORD_TOO_SHORT");
  const row=await readValidToken(db,token,"admin_password_reset");if(row.subjectType!=="admin")throw new Error("TOKEN_INVALID_OR_EXPIRED");
  const admin=await db.get("adminPrincipals",row.subjectId);if(!admin)throw new Error("TOKEN_INVALID_OR_EXPIRED");
  await db.update("authTokens",row.id,{usedAt:nowIso()});
  await db.update("adminPrincipals",admin.id,{passwordHash:hashPassword(newPassword)});
  for(const session of await db.find("adminSessions",x=>x.principalId===admin.id&&!x.revokedAt))await db.update("adminSessions",session.id,{revokedAt:nowIso()});
  await db.insert("adminAuditEvents",{principalId:admin.id,action:"admin.password.reset",target:admin.id});
  void notifySecurityChange(admin.email,"Your Yaposan Admin password was reset","Your Yaposan Admin password was reset and existing Admin sessions were signed out.");
  return {reset:true};
}

export async function adminResetPrincipalPassword(db:DatabaseAdapter,actor:AdminPrincipalRecord,targetId:string,newPassword:string,confirmPassword:string,currentActorPassword:string){
  if(actor.role!=="super_admin")throw new Error("ADMIN_FORBIDDEN");if(!currentActorPassword||!verifyPassword(currentActorPassword,actor.passwordHash))throw new Error("ADMIN_STEP_UP_REQUIRED");if(newPassword!==confirmPassword)throw new Error("PASSWORD_CONFIRMATION_MISMATCH");if(newPassword.length<14)throw new Error("ADMIN_PASSWORD_TOO_SHORT");
  const target=await db.get("adminPrincipals",targetId);if(!target)throw new Error("ADMIN_PRINCIPAL_NOT_FOUND");
  await db.update("adminPrincipals",target.id,{passwordHash:hashPassword(newPassword)});for(const session of await db.find("adminSessions",x=>x.principalId===target.id&&!x.revokedAt))await db.update("adminSessions",session.id,{revokedAt:nowIso()});
  await db.insert("adminAuditEvents",{principalId:actor.id,action:"admin.principal.password_reset",target:target.id,metadata:{email:target.email,stepUp:"current_password"}});void notifySecurityChange(target.email,"Your Yaposan Admin password was changed","A Super Admin reset your Yaposan Admin password and existing Admin sessions were signed out.");return {adminId:target.id,reset:true,sessionsRevoked:true,stepUpVerified:true};
}
