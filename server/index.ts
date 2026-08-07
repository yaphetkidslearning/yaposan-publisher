import { randomUUID } from "node:crypto";
<<<<<<< HEAD
import { getDatabase } from "./database";
import { loadCloudConfig, validateProductionConfig } from "./config";
import { issueSession, provisionAccount, publicUser, verifyPassword, verifyToken } from "./identity";
import { LocalObjectStorage, R2ObjectStorage, type ObjectStorage } from "./storage";
import { createBillingPortal, createCheckoutSession, createCustomer, verifyStripeWebhook } from "./payments";
import { PLAN_CATALOG, resolveEntitlements, syncStripeSubscription, usageLimitsFor } from "./billingPlatform";
import { runAiGateway } from "./aiPlatform";
import { applyCollaborationOperation, configureCollaborationStore, createComment, joinCollaboration, listApprovals, listComments, listOperations, listPresence, resolveComment, setApproval, updatePresence } from "./collaboration";
import { buildExportManifest, cancelExportJob, claimNextExportJob, createExportJob, retryExportJob, updateExportJob } from "./productionExport";
import { createCsrfToken, isOriginAllowed, loadSecurityEnvironment, passwordPolicy, securityHeaders, validateUpload } from "./securityPlatform";
import { constantTimeEqual, isConfiguredAdmin, requireProjectAccess, requireWorkspaceAccess } from "./authorization";
import { commercialDiagnostics, validateCheckoutSelection, verifyLicense } from "./commercialReadiness";
import { RuntimeMetrics, buildReleaseEvidence, clientIp, installGracefulShutdown, runReadinessChecks, safeTokenEqual } from "./operations";
import { BoundedRateLimiter, inspectJsonComplexity, validateRequestTarget } from "./securityCertification";
import { adminSummary, changeMemberRole, createShareLink, inviteExistingUser, listNotifications, listOrganizationMembers, removeMember, restoreProjectVersion, updateProjectLifecycle } from "./commercialPlatform";
import { createReferralCode, creatorDashboard, listCreatorProducts, moderateCreatorProduct, purchaseCreatorProduct, redeemReferralCode, submitCreatorProduct } from "./creatorMarketplace";
import { createBackupSnapshot, listOperationsAudit, listOperationsJobs, operationsSummary, productionCertification, scheduleAutomation, updateOperationsJob } from "./enterpriseOperations";
=======
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { runAiGateway } from "./aiPlatform";
import {
  constantTimeEqual,
  isConfiguredAdmin,
  requireProjectAccess,
  requireWorkspaceAccess,
} from "./authorization";
import {
  PLAN_CATALOG,
  resolveEntitlements,
  syncStripeSubscription,
  usageLimitsFor,
} from "./billingPlatform";
import {
  applyCollaborationOperation,
  configureCollaborationStore,
  createComment,
  joinCollaboration,
  listApprovals,
  listComments,
  listOperations,
  listPresence,
  resolveComment,
  setApproval,
  updatePresence,
} from "./collaboration";
import {
  adminSummary,
  changeMemberRole,
  createShareLink,
  inviteExistingUser,
  listNotifications,
  listOrganizationMembers,
  removeMember,
  restoreProjectVersion,
  updateProjectLifecycle,
} from "./commercialPlatform";
import {
  commercialDiagnostics,
  validateCheckoutSelection,
  verifyLicense,
} from "./commercialReadiness";
import {
  loadCloudConfig,
  validateProductionConfig,
} from "./config";
import {
  createReferralCode,
  creatorDashboard,
  listCreatorProducts,
  moderateCreatorProduct,
  purchaseCreatorProduct,
  redeemReferralCode,
  submitCreatorProduct,
} from "./creatorMarketplace";
import { getDatabase } from "./database";
import {
  createBackupSnapshot,
  listOperationsAudit,
  listOperationsJobs,
  operationsSummary,
  productionCertification,
  scheduleAutomation,
  updateOperationsJob,
} from "./enterpriseOperations";
import {
  issueSession,
  provisionAccount,
  publicUser,
  verifyPassword,
  verifyToken,
} from "./identity";
import {
  buildReleaseEvidence,
  clientIp,
  installGracefulShutdown,
  runReadinessChecks,
  RuntimeMetrics,
  safeTokenEqual,
} from "./operations";
import {
  createBillingPortal,
  createCheckoutSession,
  createCustomer,
  verifyStripeWebhook,
} from "./payments";
import {
  buildExportManifest,
  cancelExportJob,
  claimNextExportJob,
  createExportJob,
  retryExportJob,
  updateExportJob,
} from "./productionExport";
import {
  BoundedRateLimiter,
  inspectJsonComplexity,
  validateRequestTarget,
} from "./securityCertification";
import {
  createCsrfToken,
  isOriginAllowed,
  loadSecurityEnvironment,
  passwordPolicy,
  securityHeaders,
  validateUpload,
} from "./securityPlatform";
import {
  LocalObjectStorage,
  R2ObjectStorage,
  type ObjectStorage,
} from "./storage";
>>>>>>> 7cb644c (Fix API startup for Render)

const config = loadCloudConfig();
const runtimeMetrics = new RuntimeMetrics();
const releaseVersion = "1.0.0";

const collaborationStoreReady = configureCollaborationStore({
  driver: config.collaborationDriver,
  redisUrl: config.redisUrl,
});

const securityConfig = loadSecurityEnvironment();

const identityConfig = {
  secret: config.sessionSecret,
  accessTokenMinutes: config.accessTokenMinutes,
  refreshTokenDays: config.refreshTokenDays,
};

<<<<<<< HEAD
export async function handleRequest(req:IncomingMessage,res:ServerResponse){const targetCheck=validateRequestTarget(req.url??"/",{maxBodyBytes:config.maxRequestBodyBytes,maxJsonDepth:config.maxJsonDepth,maxJsonNodes:config.maxJsonNodes,maxStringLength:config.maxRequestBodyBytes,maxQueryParameters:config.maxQueryParameters,maxPathLength:2048});const requestId=String(req.headers["x-request-id"]??randomUUID());const url=new URL(req.url??"/","http://localhost");const ip=clientIp(req,config.trustProxy);const finishMetric=runtimeMetrics.begin(req.method);res.once("finish",()=>finishMetric(res.statusCode));req.setTimeout(config.requestTimeoutMs,()=>{if(!res.headersSent)json(res,408,{error:{code:"REQUEST_TIMEOUT",message:"Request exceeded the configured time limit"}},requestId);req.destroy()});try{
 if(!targetCheck.valid)return json(res,400,{error:{code:"INVALID_REQUEST_TARGET",message:"Request target failed security validation",details:targetCheck.findings}},requestId);
 if(!isOriginAllowed(String(req.headers.origin??"" )||undefined,securityConfig.publicOrigins))return json(res,403,{error:{code:"ORIGIN_NOT_ALLOWED",message:"Request origin is not trusted"}},requestId);
 if(rateLimit(ip))return json(res,429,{error:{code:"RATE_LIMITED",message:"Too many requests"}},requestId);
 if(url.pathname==="/health"||url.pathname==="/live")return json(res,200,{status:"ok",version:releaseVersion,time:new Date().toISOString(),uptimeSeconds:runtimeMetrics.snapshot().uptimeSeconds},requestId);
 if(url.pathname==="/metrics"){if(!safeTokenEqual(String(req.headers["x-metrics-token"]??""),config.metricsToken))return json(res,401,{error:{code:"METRICS_UNAUTHORIZED",message:"Valid metrics token required"}},requestId);return text(res,200,runtimeMetrics.prometheus(),requestId,"text/plain; version=0.0.4; charset=utf-8")}
 if(url.pathname==="/release"){const issues=validateProductionConfig(config);return json(res,200,buildReleaseEvidence({version:releaseVersion,commitSha:process.env.GIT_COMMIT_SHA,buildId:process.env.BUILD_ID,nodeEnv:process.env.NODE_ENV,configIssues:issues,testsPassed:Number(process.env.RELEASE_TESTS_PASSED)||undefined,testsFailed:Number(process.env.RELEASE_TESTS_FAILED)||undefined}),requestId)}
 if(url.pathname==="/ready"){const issues=validateProductionConfig(config);const db=await getDatabase();const report=await runReadinessChecks({database:db,storage,configurationIssues:issues,timeoutMs:config.readinessTimeoutMs,storageProbe:config.readinessStorageProbe});return json(res,report.ready?200:503,{status:report.ready?"ready":"degraded",...report},requestId)}
 const db=await getDatabase();
 if(req.method==="POST"&&url.pathname==="/api/v1/auth/register"){const b=await bodyJson(req);const email=String(b.email??"").toLowerCase(),password=String(b.password??"");const passwordCheck=passwordPolicy(password,email);if(!/^\S+@\S+\.\S+$/.test(email)||!passwordCheck.valid)return json(res,400,{error:{code:"INVALID_INPUT",message:"Valid email and strong password required",details:passwordCheck.issues}},requestId);if((await db.find("users",u=>u.email===email)).length)return json(res,409,{error:{code:"EMAIL_EXISTS",message:"Account already exists"}},requestId);const account=await provisionAccount(db,{email,password,organizationName:b.organizationName,region:b.region});const session=issueSession(account.user.id,identityConfig);await db.insert("auditEvents",{organizationId:account.organization.id,actorUserId:account.user.id,action:"user.registered",target:account.user.id,requestId});return json(res,201,{user:publicUser(account.user),organization:account.organization,workspace:account.workspace,...session},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/auth/login"){const b=await bodyJson(req);const user=(await db.find("users",u=>u.email.toLowerCase()===String(b.email??"").toLowerCase()))[0];if(!user||!verifyPassword(String(b.password??""),user.passwordHash))return json(res,401,{error:{code:"INVALID_CREDENTIALS",message:"Invalid credentials"}},requestId);if(user.status!=="active")return json(res,403,{error:{code:"ACCOUNT_DISABLED",message:"Account is disabled"}},requestId);return json(res,200,{user:publicUser(user),...issueSession(user.id,identityConfig)},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/auth/refresh"){const b=await bodyJson(req);const claims=verifyToken(String(b.refreshToken??""),identityConfig.secret,"refresh");if(!claims)return json(res,401,{error:{code:"INVALID_REFRESH_TOKEN",message:"Refresh token is invalid or expired"}},requestId);return json(res,200,issueSession(claims.sub,identityConfig,claims.sid),requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/webhooks/stripe"){const raw=(await readBody(req)).toString();if(!verifyStripeWebhook(raw,String(req.headers["stripe-signature"]??"")))return json(res,400,{error:{code:"INVALID_SIGNATURE",message:"Webhook signature failed"}},requestId);const event=JSON.parse(raw);await syncStripeSubscription(db,event);await db.insert("auditEvents",{action:"stripe.webhook.received",requestId,metadata:{eventId:event.id,type:event.type}});return json(res,200,{received:true},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/exports/worker/claim"){if(!constantTimeEqual(String(req.headers["x-worker-token"]??""),config.exportWorkerToken))return json(res,401,{error:{code:"WORKER_UNAUTHORIZED",message:"Valid worker token required"}},requestId);return json(res,200,{job:await claimNextExportJob(db)},requestId)}
 const workerUpdate=match(url.pathname,/^\/api\/v1\/exports\/worker\/([^/]+)$/);
 if(workerUpdate&&req.method==="PUT"){if(!constantTimeEqual(String(req.headers["x-worker-token"]??""),config.exportWorkerToken))return json(res,401,{error:{code:"WORKER_UNAUTHORIZED",message:"Valid worker token required"}},requestId);return json(res,200,{job:await updateExportJob(db,workerUpdate[1],await bodyJson(req))},requestId)}
 const claims=verifyToken(String(req.headers.authorization??""),identityConfig.secret,"access");if(!claims)return json(res,401,{error:{code:"UNAUTHORIZED",message:"Authentication required"}},requestId);const userId=claims.sub;
 const membershipForUser=(await db.find("memberships",m=>m.userId===userId))[0];
 const organizationForUser=membershipForUser?await db.get("organizations",membershipForUser.organizationId):undefined;
 const subscriptionForUser=membershipForUser?(await db.find("subscriptions",x=>x.organizationId===membershipForUser.organizationId))[0]:undefined;
 const entitlementsForUser=organizationForUser?resolveEntitlements(organizationForUser,subscriptionForUser):undefined;
 const usageLimits=usageLimitsFor(entitlementsForUser?.plan??"free");
 const monthKey=new Date().toISOString().slice(0,7),dayKey=new Date().toISOString().slice(0,10);
 const userAuditEvents=await db.find("auditEvents",event=>event.actorUserId===userId);
 const monthlyExportCount=userAuditEvents.filter(event=>event.action==="usage.export"&&String(event.metadata?.period??"")===monthKey).length;
 const dailyAiCount=userAuditEvents.filter(event=>event.action==="usage.ai"&&String(event.metadata?.period??"")===dayKey).length;
 if(req.method==="GET"&&url.pathname==="/api/v1/team/members")return json(res,200,await listOrganizationMembers(db,userId),requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/team/invitations"){const b=await bodyJson(req);return json(res,201,{membership:await inviteExistingUser(db,userId,{email:String(b.email??""),role:b.role})},requestId)}
 const memberRole=match(url.pathname,/^\/api\/v1\/team\/members\/([^/]+)\/role$/);
 if(memberRole&&req.method==="PUT"){const b=await bodyJson(req);return json(res,200,{membership:await changeMemberRole(db,userId,memberRole[1],b.role)},requestId)}
 const memberDelete=match(url.pathname,/^\/api\/v1\/team\/members\/([^/]+)$/);
 if(memberDelete&&req.method==="DELETE")return json(res,200,{removed:await removeMember(db,userId,memberDelete[1])},requestId);
 const lifecycle=match(url.pathname,/^\/api\/v1\/projects\/([^/]+)\/lifecycle$/);
 if(lifecycle&&req.method==="PUT")return json(res,200,{project:await updateProjectLifecycle(db,userId,lifecycle[1],await bodyJson(req))},requestId);
 const versionRestore=match(url.pathname,/^\/api\/v1\/projects\/([^/]+)\/versions\/([^/]+)\/restore$/);
 if(versionRestore&&req.method==="POST")return json(res,200,{project:await restoreProjectVersion(db,userId,versionRestore[1],versionRestore[2])},requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/share-links"){const b=await bodyJson(req);return json(res,201,{share:await createShareLink(db,userId,{projectId:String(b.projectId??""),access:b.access,expiresAt:b.expiresAt,password:b.password})},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/notifications")return json(res,200,{items:await listNotifications(db,userId)},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/admin/summary")return json(res,200,await adminSummary(db,userId,config.adminEmails),requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/enterprise-operations/summary")return json(res,200,await operationsSummary(db,userId,config.adminEmails),requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/enterprise-operations/jobs")return json(res,200,{items:await listOperationsJobs(db,userId,config.adminEmails,{status:url.searchParams.get("status")??undefined,kind:url.searchParams.get("kind")??undefined,limit:Number(url.searchParams.get("limit")??100)})},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/enterprise-operations/audit")return json(res,200,{items:await listOperationsAudit(db,userId,config.adminEmails,Number(url.searchParams.get("limit")??100))},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/enterprise-operations/certification")return json(res,200,await productionCertification(db,userId,config.adminEmails,validateProductionConfig(config)),requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/enterprise-operations/automations"){const b=await bodyJson(req);return json(res,201,{job:await scheduleAutomation(db,userId,config.adminEmails,{name:b.name,task:b.task,schedule:b.schedule,payload:b.payload})},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/enterprise-operations/backups")return json(res,201,{snapshot:await createBackupSnapshot(db,userId,config.adminEmails)},requestId);
 const operationsJobAction=match(url.pathname,/^\/api\/v1\/enterprise-operations\/jobs\/([^/]+)\/(cancel|retry)$/);
 if(operationsJobAction&&req.method==="POST")return json(res,200,{job:await updateOperationsJob(db,userId,config.adminEmails,operationsJobAction[1],operationsJobAction[2] as "cancel"|"retry")},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/creator-marketplace/products")return json(res,200,{items:await listCreatorProducts(db,{approvedOnly:true})},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/creator-marketplace/dashboard")return json(res,200,await creatorDashboard(db,userId),requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/creator-marketplace/products"){const b=await bodyJson(req);return json(res,201,{product:await submitCreatorProduct(db,userId,{kind:b.kind,name:String(b.name??""),description:b.description,priceCents:b.priceCents,license:b.license,payload:b.payload})},requestId)}
 const creatorModeration=match(url.pathname,/^\/api\/v1\/creator-marketplace\/products\/([^/]+)\/moderate$/);
 if(creatorModeration&&req.method==="POST"){const b=await bodyJson(req);return json(res,200,{product:await moderateCreatorProduct(db,userId,creatorModeration[1],Boolean(b.approved),config.adminEmails)},requestId)}
 const creatorPurchase=match(url.pathname,/^\/api\/v1\/creator-marketplace\/products\/([^/]+)\/purchase$/);
 if(creatorPurchase&&req.method==="POST")return json(res,200,await purchaseCreatorProduct(db,userId,creatorPurchase[1]),requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/referrals/code")return json(res,200,await createReferralCode(db,userId),requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/referrals/redeem"){const b=await bodyJson(req);return json(res,200,await redeemReferralCode(db,userId,String(b.code??"")),requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/usage/status"){const projectCount=(await db.find("projects",p=>p.ownerUserId===userId&&!p.deletedAt)).length;const storageBytes=(await db.find("assets",a=>a.ownerUserId===userId)).reduce((total,asset)=>total+Math.max(0,Number(asset.size)||0),0);const storageLimit=entitlementsForUser?.limits.storageBytes??PLAN_CATALOG.free.storageBytes;const nextDay=new Date();nextDay.setUTCHours(24,0,0,0);const nextMonth=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1));const limits={...usageLimits,storageBytes:storageLimit};const usage={cloudProjects:projectCount,monthlyExports:monthlyExportCount,dailyAi:dailyAiCount,storageBytes};return json(res,200,{plan:entitlementsForUser?.plan??"free",planName:PLAN_CATALOG[entitlementsForUser?.plan??"free"]?.name??"Free",usage,limits,remaining:{cloudProjects:Math.max(0,limits.cloudProjects-projectCount),monthlyExports:Math.max(0,limits.monthlyExports-monthlyExportCount),dailyAi:Math.max(0,limits.dailyAi-dailyAiCount),storageBytes:Math.max(0,storageLimit-storageBytes)},resets:{dailyAiAt:nextDay.toISOString(),monthlyExportsAt:nextMonth.toISOString()}},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/usage/authorize-export"){const b=await bodyJson(req);const formats=(Array.isArray(b.formats)?b.formats:[b.format]).map((value:unknown)=>String(value??"").toLowerCase()).filter(Boolean);if(monthlyExportCount>=usageLimits.monthlyExports)return json(res,402,{error:{code:"EXPORT_LIMIT_REACHED",message:`You have reached your ${usageLimits.monthlyExports} monthly exports. Upgrade to continue exporting.`}},requestId);const blocked=formats.find((format:string)=>!usageLimits.standardFormats.includes(format));if(blocked)return json(res,402,{error:{code:"FORMAT_NOT_INCLUDED",message:`${blocked.toUpperCase()} export is not included in your current plan.`}},requestId);await db.insert("auditEvents",{organizationId:membershipForUser?.organizationId,actorUserId:userId,action:"usage.export",requestId,metadata:{period:monthKey,formats}});return json(res,200,{authorized:true,remaining:Math.max(0,usageLimits.monthlyExports-monthlyExportCount-1)},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/me"){const user=await db.get("users",userId);return user?json(res,200,{user:publicUser(user),isAdmin:isConfiguredAdmin(user.email,config.adminEmails)},requestId):json(res,404,{error:{code:"NOT_FOUND",message:"User not found"}},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/license/status"){const token=String(req.headers["x-license-token"]??"");return json(res,200,{license:verifyLicense(token,config.licenseSigningSecret??"")},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/admin/commercial-diagnostics"){const user=await db.get("users",userId);if(!user||!isConfiguredAdmin(user.email,config.adminEmails))return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required"}},requestId);return json(res,200,{diagnostics:commercialDiagnostics()},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/admin/status"){const user=await db.get("users",userId);if(!user||!isConfiguredAdmin(user.email,config.adminEmails))return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required"}},requestId);return json(res,200,{admin:true,email:user.email,configurationIssues:validateProductionConfig(config)},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/workspaces"){const memberships=await db.find("memberships",m=>m.userId===userId);const orgs=new Set(memberships.map(m=>m.organizationId));return json(res,200,{items:await db.find("workspaces",w=>orgs.has(w.organizationId))},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/projects")return json(res,200,{items:await db.find("projects",p=>p.ownerUserId===userId&&!p.deletedAt)},requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/projects"){const existingProjects=await db.find("projects",p=>p.ownerUserId===userId&&!p.deletedAt);if(existingProjects.length>=usageLimits.cloudProjects)return json(res,402,{error:{code:"PROJECT_LIMIT_REACHED",message:`You have reached your ${usageLimits.cloudProjects} cloud-project limit. Upgrade to save more projects.`}},requestId);const b=await bodyJson(req);await requireWorkspaceAccess(db,userId,String(b.workspaceId),true);const project=await db.insert("projects",{workspaceId:String(b.workspaceId),ownerUserId:userId,name:String(b.name??"Untitled Project"),revision:1,payload:b.payload??{}});await db.insert("versions",{projectId:project.id,revision:1,payload:project.payload,actorUserId:userId});return json(res,201,{project},requestId)}
 const projectMatch=match(url.pathname,/^\/api\/v1\/projects\/([^/]+)$/);
 if(projectMatch&&req.method==="PUT"){const id=projectMatch[1];const current=await db.get("projects",id);if(!current||current.ownerUserId!==userId)return json(res,404,{error:{code:"NOT_FOUND",message:"Project not found"}},requestId);const b=await bodyJson(req);if(Number(b.baseRevision)!==current.revision)return json(res,409,{error:{code:"REVISION_CONFLICT",message:"Project changed on another device"},project:current},requestId);const project=await db.update("projects",id,{name:b.name??current.name,payload:b.payload??current.payload,revision:current.revision+1});await db.insert("versions",{projectId:id,revision:project.revision,payload:project.payload,actorUserId:userId});return json(res,200,{project},requestId)}
 if(projectMatch&&req.method==="DELETE"){const current=await db.get("projects",projectMatch[1]);if(!current||current.ownerUserId!==userId)return json(res,404,{error:{code:"NOT_FOUND",message:"Project not found"}},requestId);return json(res,200,{project:await db.update("projects",current.id,{deletedAt:new Date().toISOString()})},requestId)}
 const versionsMatch=match(url.pathname,/^\/api\/v1\/projects\/([^/]+)\/versions$/);
 if(versionsMatch&&req.method==="GET"){const project=await db.get("projects",versionsMatch[1]);if(!project||project.ownerUserId!==userId)return json(res,404,{error:{code:"NOT_FOUND",message:"Project not found"}},requestId);return json(res,200,{items:(await db.find("versions",v=>v.projectId===project.id)).sort((a,b)=>b.revision-a.revision)},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/security/csrf")return json(res,200,{csrfToken:createCsrfToken(claims.sid,securityConfig.sessionSecret)},requestId);
 if(req.method==="POST"&&url.pathname==="/api/v1/assets/upload-plan"){const b=await bodyJson(req);await requireWorkspaceAccess(db,userId,String(b.workspaceId),true);const uploadCheck=validateUpload({name:String(b.name??""),contentType:String(b.contentType??"application/octet-stream"),size:Number(b.size??0),checksum:String(b.checksum??"")});if(!uploadCheck.valid)return json(res,400,{error:{code:"UNSAFE_UPLOAD",message:"Upload rejected",details:uploadCheck.issues}},requestId);const plan=await storage.createUploadPlan({workspaceId:String(b.workspaceId),name:String(b.name),contentType:String(b.contentType??"application/octet-stream"),size:Number(b.size??0)});return json(res,201,{upload:plan},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/assets/complete"){const b=await bodyJson(req);await requireWorkspaceAccess(db,userId,String(b.workspaceId),true);const currentStorage=(await db.find("assets",a=>a.ownerUserId===userId)).reduce((total,asset)=>total+Math.max(0,Number(asset.size)||0),0);const incomingSize=Math.max(0,Number(b.size)||0);const storageLimit=entitlementsForUser?.limits.storageBytes??PLAN_CATALOG.free.storageBytes;if(currentStorage+incomingSize>storageLimit)return json(res,402,{error:{code:"STORAGE_LIMIT_REACHED",message:"Your cloud storage limit has been reached. Remove assets or upgrade your plan."}},requestId);const asset=await db.insert("assets",{workspaceId:String(b.workspaceId),ownerUserId:userId,name:String(b.name),mimeType:String(b.contentType),size:incomingSize,storageKey:String(b.key),checksum:b.checksum});return json(res,201,{asset},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/billing/plans")return json(res,200,{items:Object.values(PLAN_CATALOG).map(plan=>({id:plan.id,name:plan.name,monthlyCents:plan.monthlyCents,features:plan.features}))},requestId);
 if(req.method==="GET"&&url.pathname==="/api/v1/billing/entitlements"){const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const org=await db.get("organizations",membership.organizationId);const sub=(await db.find("subscriptions",s=>s.organizationId===membership.organizationId))[0];return json(res,200,{entitlements:resolveEntitlements(org!,sub)},requestId)}
 if(req.method==="GET"&&url.pathname==="/api/v1/billing/status"){const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const org=await db.get("organizations",membership.organizationId);const sub=(await db.find("subscriptions",s=>s.organizationId===membership.organizationId))[0];const ent=resolveEntitlements(org!,sub);return json(res,200,{plan:ent.plan,planName:PLAN_CATALOG[ent.plan].name,status:sub?.status??"active",customerConfigured:Boolean(sub?.providerCustomerId),subscriptionConfigured:Boolean(sub?.providerSubscriptionId)},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/ai/generate"){if(dailyAiCount>=usageLimits.dailyAi)return json(res,402,{error:{code:"AI_LIMIT_REACHED",message:`You have reached your ${usageLimits.dailyAi} daily AI generations. Upgrade or try again tomorrow.`}},requestId);const b=await bodyJson(req);const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const org=await db.get("organizations",membership.organizationId);const sub=(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0];const ent=resolveEntitlements(org!,sub);const result=await runAiGateway(db,{...b,userId,organizationId:membership.organizationId,plan:ent.plan});await db.insert("auditEvents",{organizationId:membership.organizationId,actorUserId:userId,action:"usage.ai",requestId,metadata:{period:dayKey}});return json(res,200,result,requestId)};
 if(req.method==="POST"&&url.pathname==="/api/v1/billing/checkout"){const b=await bodyJson(req);for(const candidate of [String(b.successUrl??""),String(b.cancelUrl??"")]){const target=new URL(candidate);if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNSAFE_CHECKOUT_URL",message:"Checkout return URL is not allowed"}},requestId);}const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const selection=validateCheckoutSelection({plan:String(b.plan??""),quantity:b.quantity,successUrl:String(b.successUrl??""),cancelUrl:String(b.cancelUrl??"")});let sub=(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0];if(!sub)sub=await db.insert("subscriptions",{organizationId:membership.organizationId,plan:"free",status:"active",seats:1});let customerId=sub.providerCustomerId;if(!customerId){const user=await db.get("users",userId);const customer=await createCustomer(user?.email??"",undefined,{organizationId:membership.organizationId,userId});customerId=String(customer.id);sub=(await db.update("subscriptions",sub.id,{providerCustomerId:customerId}))!;}const session=await createCheckoutSession({customerId,priceId:selection.priceId,quantity:selection.quantity,successUrl:String(b.successUrl),cancelUrl:String(b.cancelUrl),organizationId:membership.organizationId,plan:selection.plan});return json(res,200,{id:session.id,url:session.url},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/billing/portal"){const b=await bodyJson(req);const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const sub=(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0];if(!sub?.providerCustomerId)return json(res,409,{error:{code:"BILLING_CUSTOMER_REQUIRED",message:"Start a paid plan before opening the billing portal."}},requestId);const returnUrl=String(b.returnUrl??"");const parsed=new URL(returnUrl);if((parsed.protocol!=="https:"&&parsed.hostname!=="localhost")||!isOriginAllowed(parsed.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNSAFE_RETURN_URL",message:"Billing return URL is not allowed"}},requestId);const portal=await createBillingPortal(sub.providerCustomerId,returnUrl);return json(res,200,{id:portal.id,url:portal.url},requestId)}
 const collabJoin=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/join$/);
 if(collabJoin&&req.method==="POST"){await requireProjectAccess(db,userId,collabJoin[1],false);const b=await bodyJson(req);return json(res,201,{session:await joinCollaboration({projectId:collabJoin[1],userId,displayName:String(b.displayName??"Collaborator"),color:String(b.color??"#f97316"),selectionIds:[]})},requestId)}
 const collabPresence=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/presence$/);
 if(collabPresence&&req.method==="GET"){await requireProjectAccess(db,userId,collabPresence[1],false);return json(res,200,{items:await listPresence(collabPresence[1])},requestId)}
 const collabSession=match(url.pathname,/^\/api\/v1\/collaboration\/sessions\/([^/]+)$/);
 if(collabSession&&req.method==="PUT")return json(res,200,{session:await updatePresence(collabSession[1],userId,await bodyJson(req))},requestId);
 const collabOps=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/operations$/);
 if(collabOps&&req.method==="GET"){await requireProjectAccess(db,userId,collabOps[1],false);return json(res,200,{items:await listOperations(collabOps[1],Number(url.searchParams.get("afterRevision")??0))},requestId)}
 if(collabOps&&req.method==="POST"){await requireProjectAccess(db,userId,collabOps[1],true);const b=await bodyJson(req);return json(res,200,await applyCollaborationOperation(db,{projectId:collabOps[1],actorUserId:userId,baseRevision:Number(b.baseRevision),kind:b.kind??"patch",payload:b.payload}),requestId)}
 const collabComments=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/comments$/);
 if(collabComments&&req.method==="GET"){await requireProjectAccess(db,userId,collabComments[1],false);return json(res,200,{items:await listComments(collabComments[1])},requestId)}
 if(collabComments&&req.method==="POST"){await requireProjectAccess(db,userId,collabComments[1],true);const b=await bodyJson(req);return json(res,201,{comment:await createComment({projectId:collabComments[1],authorUserId:userId,body:String(b.body??""),mentions:b.mentions,parentId:b.parentId})},requestId)}
 const resolveCommentMatch=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/comments\/([^/]+)\/resolve$/);
 if(resolveCommentMatch&&req.method==="POST"){await requireProjectAccess(db,userId,resolveCommentMatch[1],true);return json(res,200,{comment:await resolveComment(resolveCommentMatch[1],resolveCommentMatch[2],true)},requestId)}
 const approvalsMatch=match(url.pathname,/^\/api\/v1\/collaboration\/([^/]+)\/approvals$/);
 if(approvalsMatch&&req.method==="GET"){await requireProjectAccess(db,userId,approvalsMatch[1],false);return json(res,200,{items:await listApprovals(approvalsMatch[1])},requestId)}
 if(approvalsMatch&&req.method==="POST"){await requireProjectAccess(db,userId,approvalsMatch[1],true);const b=await bodyJson(req);return json(res,200,{approval:await setApproval({projectId:approvalsMatch[1],reviewerUserId:userId,status:b.status??"requested",note:b.note})},requestId)}
 if(req.method==="POST"&&url.pathname==="/api/v1/exports"){const b=await bodyJson(req);await requireProjectAccess(db,userId,String(b.projectId),false);await requireWorkspaceAccess(db,userId,String(b.workspaceId),false);return json(res,202,{job:await createExportJob(db,{...b,userId})},requestId)}
 const exportMatch=match(url.pathname,/^\/api\/v1\/exports\/([^/]+)$/);
 if(exportMatch&&req.method==="GET"){const job=await db.get("jobs",exportMatch[1]);const payload=job?.payload as {userId?:string}|undefined;if(!job||payload?.userId!==userId)return json(res,404,{error:{code:"NOT_FOUND",message:"Export job not found"}},requestId);return json(res,200,{job,manifest:job.status==="succeeded"?buildExportManifest(job):undefined},requestId)}
 const exportAction=match(url.pathname,/^\/api\/v1\/exports\/([^/]+)\/(cancel|retry)$/);
 if(exportAction&&req.method==="POST"){const job=await db.get("jobs",exportAction[1]);const payload=job?.payload as {userId?:string}|undefined;if(!job||payload?.userId!==userId)return json(res,404,{error:{code:"NOT_FOUND",message:"Export job not found"}},requestId);return json(res,200,{job:exportAction[2]==="cancel"?await cancelExportJob(db,exportAction[1]):await retryExportJob(db,exportAction[1])},requestId)}
 return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found"}},requestId);
 }catch(error){const message=error instanceof Error?error.message:"Unknown error";console.error(JSON.stringify({level:"error",requestId,path:req.url,message}));const clientErrors=new Set(["INVALID_CHECKOUT_PLAN","INVALID_CHECKOUT_QUANTITY","UNSAFE_CHECKOUT_URL","UNSAFE_RETURN_URL","PLAN_NOT_PURCHASABLE"]);const configErrors=new Set(["STRIPE_NOT_CONFIGURED","STRIPE_PRICE_NOT_CONFIGURED","STRIPE_WEBHOOK_SECRET_MISSING"]);const status=message==="PAYLOAD_TOO_LARGE"?413:clientErrors.has(message)?400:configErrors.has(message)?503:500;const publicMessage=status<500?message.replaceAll("_"," ").toLowerCase():status===503?"Billing is not configured yet.":process.env.NODE_ENV==="production"?"Internal server error":message;return json(res,status,{error:{code:message,message:publicMessage}},requestId)}}
export function createApiServer(){return createServer(handleRequest)}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,"/"))){
 const issues=validateProductionConfig(config);
 if(issues.length&&process.env.NODE_ENV==="production")throw new Error(issues.join("; "));
 const port=Number(process.env.PORT??4100);
 const server=createApiServer();
 server.headersTimeout=Math.max(config.requestTimeoutMs+5000,10000);
 server.requestTimeout=config.requestTimeoutMs;
 server.keepAliveTimeout=5000;
 server.listen(port,async()=>{
  const db=await getDatabase();
  installGracefulShutdown({server,database:db,timeoutMs:config.shutdownTimeoutMs});
  console.log(JSON.stringify({level:"info",message:"Yaposan Publisher v1.0.0 API listening",version:releaseVersion,port,buildId:process.env.BUILD_ID??"local",commitSha:process.env.GIT_COMMIT_SHA??"unknown"}));
 });
=======
let storage: ObjectStorage =
  config.storageDriver === "r2"
    ? new R2ObjectStorage({
        endpoint:
          config.storageEndpoint ?? "https://storage.invalid",
        bucket: config.storageBucket,
        accessKeyId: config.r2AccessKeyId ?? "",
        secretAccessKey: config.r2SecretAccessKey ?? "",
        region: config.r2SigningRegion,
        publicBaseUrl: config.publicAssetBaseUrl,
      })
    : new LocalObjectStorage(
        undefined,
        config.publicAssetBaseUrl
      );

export const setObjectStorage = (
  adapter: ObjectStorage
) => {
  storage = adapter;
};

const json = (
  res: ServerResponse,
  status: number,
  data: unknown,
  requestId: string
) => {
  res.writeHead(status, {
    "content-type": "application/json",
    ...securityHeaders(requestId),
  });

  res.end(JSON.stringify(data));
};

const text = (
  res: ServerResponse,
  status: number,
  data: string,
  requestId: string,
  contentType = "text/plain; charset=utf-8"
) => {
  res.writeHead(status, {
    "content-type": contentType,
    ...securityHeaders(requestId),
  });

  res.end(data);
};

const readBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const value = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk);

    size += value.length;

    if (size > config.maxRequestBodyBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks);
};

const bodyJson = async (req: IncomingMessage) => {
  const raw = await readBody(req);

  const parsed = raw.length
    ? JSON.parse(raw.toString())
    : {};

  const complexity = inspectJsonComplexity(parsed, {
    maxBodyBytes: config.maxRequestBodyBytes,
    maxJsonDepth: config.maxJsonDepth,
    maxJsonNodes: config.maxJsonNodes,
    maxStringLength: config.maxRequestBodyBytes,
    maxQueryParameters: config.maxQueryParameters,
    maxPathLength: 2048,
  });

  if (!complexity.valid) {
    throw new Error(complexity.code);
  }

  return parsed;
};

const requestLimiter = new BoundedRateLimiter({
  limit: config.rateLimitPerMinute,
  windowMs: 60_000,
  maxEntries: config.rateLimitMaxEntries,
});

function rateLimit(ip: string) {
  return !requestLimiter.check(ip).allowed;
>>>>>>> 7cb644c (Fix API startup for Render)
}

const match = (
  path: string,
  pattern: RegExp
) => pattern.exec(path);

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  const targetCheck = validateRequestTarget(
    req.url ?? "/",
    {
      maxBodyBytes: config.maxRequestBodyBytes,
      maxJsonDepth: config.maxJsonDepth,
      maxJsonNodes: config.maxJsonNodes,
      maxStringLength: config.maxRequestBodyBytes,
      maxQueryParameters:
        config.maxQueryParameters,
      maxPathLength: 2048,
    }
  );

  const requestId = String(
    req.headers["x-request-id"] ??
      randomUUID()
  );

  const url = new URL(
    req.url ?? "/",
    "http://localhost"
  );

  const ip = clientIp(
    req,
    config.trustProxy
  );

  const finishMetric =
    runtimeMetrics.begin(req.method);

  res.once("finish", () =>
    finishMetric(res.statusCode)
  );

  req.setTimeout(
    config.requestTimeoutMs,
    () => {
      if (!res.headersSent) {
        json(
          res,
          408,
          {
            error: {
              code: "REQUEST_TIMEOUT",
              message:
                "Request exceeded the configured time limit",
            },
          },
          requestId
        );
      }

      req.destroy();
    }
  );

  try {
    if (!targetCheck.valid) {
      return json(
        res,
        400,
        {
          error: {
            code:
              "INVALID_REQUEST_TARGET",
            message:
              "Request target failed security validation",
            details:
              targetCheck.findings,
          },
        },
        requestId
      );
    }

    if (
      !isOriginAllowed(
        String(req.headers.origin ?? "") ||
          undefined,
        securityConfig.publicOrigins
      )
    ) {
      return json(
        res,
        403,
        {
          error: {
            code: "ORIGIN_NOT_ALLOWED",
            message:
              "Request origin is not trusted",
          },
        },
        requestId
      );
    }

    if (rateLimit(ip)) {
      return json(
        res,
        429,
        {
          error: {
            code: "RATE_LIMITED",
            message:
              "Too many requests",
          },
        },
        requestId
      );
    }

    if (
      url.pathname === "/health" ||
      url.pathname === "/live"
    ) {
      return json(
        res,
        200,
        {
          status: "ok",
          version: releaseVersion,
          time: new Date().toISOString(),
          uptimeSeconds:
            runtimeMetrics.snapshot()
              .uptimeSeconds,
        },
        requestId
      );
    }

    if (url.pathname === "/metrics") {
      if (
        !safeTokenEqual(
          String(
            req.headers[
              "x-metrics-token"
            ] ?? ""
          ),
          config.metricsToken
        )
      ) {
        return json(
          res,
          401,
          {
            error: {
              code:
                "METRICS_UNAUTHORIZED",
              message:
                "Valid metrics token required",
            },
          },
          requestId
        );
      }

      return text(
        res,
        200,
        runtimeMetrics.prometheus(),
        requestId,
        "text/plain; version=0.0.4; charset=utf-8"
      );
    }

    if (url.pathname === "/release") {
      const issues =
        validateProductionConfig(config);

      return json(
        res,
        200,
        buildReleaseEvidence({
          version: releaseVersion,
          commitSha:
            process.env.GIT_COMMIT_SHA,
          buildId:
            process.env.BUILD_ID,
          nodeEnv:
            process.env.NODE_ENV,
          configIssues: issues,
          testsPassed:
            Number(
              process.env
                .RELEASE_TESTS_PASSED
            ) || undefined,
          testsFailed:
            Number(
              process.env
                .RELEASE_TESTS_FAILED
            ) || undefined,
        }),
        requestId
      );
    }

    if (url.pathname === "/ready") {
      const issues =
        validateProductionConfig(config);

      const db =
        await getDatabase();

      const report =
        await runReadinessChecks({
          database: db,
          storage,
          configurationIssues: issues,
          timeoutMs:
            config.readinessTimeoutMs,
          storageProbe:
            config.readinessStorageProbe,
        });

      return json(
        res,
        report.ready ? 200 : 503,
        {
          status: report.ready
            ? "ready"
            : "degraded",
          ...report,
        },
        requestId
      );
    }

    const db = await getDatabase();

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/auth/register"
    ) {
      const b = await bodyJson(req);

      const email = String(
        b.email ?? ""
      ).toLowerCase();

      const password = String(
        b.password ?? ""
      );

      const passwordCheck =
        passwordPolicy(password, email);

      if (
        !/^\S+@\S+\.\S+$/.test(
          email
        ) ||
        !passwordCheck.valid
      ) {
        return json(
          res,
          400,
          {
            error: {
              code: "INVALID_INPUT",
              message:
                "Valid email and strong password required",
              details:
                passwordCheck.issues,
            },
          },
          requestId
        );
      }

      if (
        (
          await db.find(
            "users",
            (u) => u.email === email
          )
        ).length
      ) {
        return json(
          res,
          409,
          {
            error: {
              code: "EMAIL_EXISTS",
              message:
                "Account already exists",
            },
          },
          requestId
        );
      }

      const account =
        await provisionAccount(db, {
          email,
          password,
          organizationName:
            b.organizationName,
          region: b.region,
        });

      const session = issueSession(
        account.user.id,
        identityConfig
      );

      await db.insert(
        "auditEvents",
        {
          organizationId:
            account.organization.id,
          actorUserId:
            account.user.id,
          action:
            "user.registered",
          target:
            account.user.id,
          requestId,
        }
      );

      return json(
        res,
        201,
        {
          user: publicUser(
            account.user
          ),
          organization:
            account.organization,
          workspace:
            account.workspace,
          ...session,
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/auth/login"
    ) {
      const b = await bodyJson(req);

      const user = (
        await db.find(
          "users",
          (u) =>
            u.email.toLowerCase() ===
            String(
              b.email ?? ""
            ).toLowerCase()
        )
      )[0];

      if (
        !user ||
        !verifyPassword(
          String(b.password ?? ""),
          user.passwordHash
        )
      ) {
        return json(
          res,
          401,
          {
            error: {
              code:
                "INVALID_CREDENTIALS",
              message:
                "Invalid credentials",
            },
          },
          requestId
        );
      }

      if (user.status !== "active") {
        return json(
          res,
          403,
          {
            error: {
              code:
                "ACCOUNT_DISABLED",
              message:
                "Account is disabled",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          user: publicUser(user),
          ...issueSession(
            user.id,
            identityConfig
          ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/auth/refresh"
    ) {
      const b = await bodyJson(req);

      const claims = verifyToken(
        String(
          b.refreshToken ?? ""
        ),
        identityConfig.secret,
        "refresh"
      );

      if (!claims) {
        return json(
          res,
          401,
          {
            error: {
              code:
                "INVALID_REFRESH_TOKEN",
              message:
                "Refresh token is invalid or expired",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        issueSession(
          claims.sub,
          identityConfig,
          claims.sid
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/webhooks/stripe"
    ) {
      const raw = (
        await readBody(req)
      ).toString();

      if (
        !verifyStripeWebhook(
          raw,
          String(
            req.headers[
              "stripe-signature"
            ] ?? ""
          )
        )
      ) {
        return json(
          res,
          400,
          {
            error: {
              code:
                "INVALID_SIGNATURE",
              message:
                "Webhook signature failed",
            },
          },
          requestId
        );
      }

      const event =
        JSON.parse(raw);

      await syncStripeSubscription(
        db,
        event
      );

      await db.insert(
        "auditEvents",
        {
          action:
            "stripe.webhook.received",
          requestId,
          metadata: {
            eventId: event.id,
            type: event.type,
          },
        }
      );

      return json(
        res,
        200,
        { received: true },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/exports/worker/claim"
    ) {
      if (
        !constantTimeEqual(
          String(
            req.headers[
              "x-worker-token"
            ] ?? ""
          ),
          config.exportWorkerToken
        )
      ) {
        return json(
          res,
          401,
          {
            error: {
              code:
                "WORKER_UNAUTHORIZED",
              message:
                "Valid worker token required",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          job:
            await claimNextExportJob(
              db
            ),
        },
        requestId
      );
    }

    const workerUpdate = match(
      url.pathname,
      /^\/api\/v1\/exports\/worker\/([^/]+)$/
    );

    if (
      workerUpdate &&
      req.method === "PUT"
    ) {
      if (
        !constantTimeEqual(
          String(
            req.headers[
              "x-worker-token"
            ] ?? ""
          ),
          config.exportWorkerToken
        )
      ) {
        return json(
          res,
          401,
          {
            error: {
              code:
                "WORKER_UNAUTHORIZED",
              message:
                "Valid worker token required",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          job:
            await updateExportJob(
              db,
              workerUpdate[1],
              await bodyJson(req)
            ),
        },
        requestId
      );
    }

    const claims = verifyToken(
      String(
        req.headers.authorization ??
          ""
      ),
      identityConfig.secret,
      "access"
    );

    if (!claims) {
      return json(
        res,
        401,
        {
          error: {
            code: "UNAUTHORIZED",
            message:
              "Authentication required",
          },
        },
        requestId
      );
    }

    const userId = claims.sub;

    const membershipForUser = (
      await db.find(
        "memberships",
        (m) => m.userId === userId
      )
    )[0];

    const organizationForUser =
      membershipForUser
        ? await db.get(
            "organizations",
            membershipForUser.organizationId
          )
        : undefined;

    const subscriptionForUser =
      membershipForUser
        ? (
            await db.find(
              "subscriptions",
              (x) =>
                x.organizationId ===
                membershipForUser.organizationId
            )
          )[0]
        : undefined;

    const entitlementsForUser =
      organizationForUser
        ? resolveEntitlements(
            organizationForUser,
            subscriptionForUser
          )
        : undefined;

    const usageLimits =
      usageLimitsFor(
        entitlementsForUser?.plan ??
          "free"
      );

    const monthKey =
      new Date()
        .toISOString()
        .slice(0, 7);

    const dayKey =
      new Date()
        .toISOString()
        .slice(0, 10);

    const userAuditEvents =
      await db.find(
        "auditEvents",
        (event) =>
          event.actorUserId === userId
      );

    const monthlyExportCount =
      userAuditEvents.filter(
        (event) =>
          event.action ===
            "usage.export" &&
          String(
            event.metadata?.period ??
              ""
          ) === monthKey
      ).length;

    const dailyAiCount =
      userAuditEvents.filter(
        (event) =>
          event.action ===
            "usage.ai" &&
          String(
            event.metadata?.period ??
              ""
          ) === dayKey
      ).length;

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/team/members"
    ) {
      return json(
        res,
        200,
        await listOrganizationMembers(
          db,
          userId
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/team/invitations"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          membership:
            await inviteExistingUser(
              db,
              userId,
              {
                email: String(
                  b.email ?? ""
                ),
                role: b.role,
              }
            ),
        },
        requestId
      );
    }

    const memberRole = match(
      url.pathname,
      /^\/api\/v1\/team\/members\/([^/]+)\/role$/
    );

    if (
      memberRole &&
      req.method === "PUT"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        200,
        {
          membership:
            await changeMemberRole(
              db,
              userId,
              memberRole[1],
              b.role
            ),
        },
        requestId
      );
    }

    const memberDelete = match(
      url.pathname,
      /^\/api\/v1\/team\/members\/([^/]+)$/
    );

    if (
      memberDelete &&
      req.method === "DELETE"
    ) {
      return json(
        res,
        200,
        {
          removed:
            await removeMember(
              db,
              userId,
              memberDelete[1]
            ),
        },
        requestId
      );
    }

    const lifecycle = match(
      url.pathname,
      /^\/api\/v1\/projects\/([^/]+)\/lifecycle$/
    );

    if (
      lifecycle &&
      req.method === "PUT"
    ) {
      return json(
        res,
        200,
        {
          project:
            await updateProjectLifecycle(
              db,
              userId,
              lifecycle[1],
              await bodyJson(req)
            ),
        },
        requestId
      );
    }

    const versionRestore = match(
      url.pathname,
      /^\/api\/v1\/projects\/([^/]+)\/versions\/([^/]+)\/restore$/
    );

    if (
      versionRestore &&
      req.method === "POST"
    ) {
      return json(
        res,
        200,
        {
          project:
            await restoreProjectVersion(
              db,
              userId,
              versionRestore[1],
              versionRestore[2]
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/share-links"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          share:
            await createShareLink(
              db,
              userId,
              {
                projectId: String(
                  b.projectId ?? ""
                ),
                access: b.access,
                expiresAt:
                  b.expiresAt,
                password:
                  b.password,
              }
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/notifications"
    ) {
      return json(
        res,
        200,
        {
          items:
            await listNotifications(
              db,
              userId
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/admin/summary"
    ) {
      return json(
        res,
        200,
        await adminSummary(
          db,
          userId,
          config.adminEmails
        ),
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/enterprise-operations/summary"
    ) {
      return json(
        res,
        200,
        await operationsSummary(
          db,
          userId,
          config.adminEmails
        ),
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/enterprise-operations/jobs"
    ) {
      return json(
        res,
        200,
        {
          items:
            await listOperationsJobs(
              db,
              userId,
              config.adminEmails,
              {
                status:
                  url.searchParams.get(
                    "status"
                  ) ?? undefined,
                kind:
                  url.searchParams.get(
                    "kind"
                  ) ?? undefined,
                limit: Number(
                  url.searchParams.get(
                    "limit"
                  ) ?? 100
                ),
              }
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/enterprise-operations/audit"
    ) {
      return json(
        res,
        200,
        {
          items:
            await listOperationsAudit(
              db,
              userId,
              config.adminEmails,
              Number(
                url.searchParams.get(
                  "limit"
                ) ?? 100
              )
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/enterprise-operations/certification"
    ) {
      return json(
        res,
        200,
        await productionCertification(
          db,
          userId,
          config.adminEmails,
          validateProductionConfig(
            config
          )
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/enterprise-operations/automations"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          job:
            await scheduleAutomation(
              db,
              userId,
              config.adminEmails,
              {
                name: b.name,
                task: b.task,
                schedule:
                  b.schedule,
                payload:
                  b.payload,
              }
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/enterprise-operations/backups"
    ) {
      return json(
        res,
        201,
        {
          snapshot:
            await createBackupSnapshot(
              db,
              userId,
              config.adminEmails
            ),
        },
        requestId
      );
    }

    const operationsJobAction =
      match(
        url.pathname,
        /^\/api\/v1\/enterprise-operations\/jobs\/([^/]+)\/(cancel|retry)$/
      );

    if (
      operationsJobAction &&
      req.method === "POST"
    ) {
      return json(
        res,
        200,
        {
          job:
            await updateOperationsJob(
              db,
              userId,
              config.adminEmails,
              operationsJobAction[1],
              operationsJobAction[2] as
                | "cancel"
                | "retry"
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/creator-marketplace/products"
    ) {
      return json(
        res,
        200,
        {
          items:
            await listCreatorProducts(
              db,
              {
                approvedOnly: true,
              }
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/creator-marketplace/dashboard"
    ) {
      return json(
        res,
        200,
        await creatorDashboard(
          db,
          userId
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/creator-marketplace/products"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          product:
            await submitCreatorProduct(
              db,
              userId,
              {
                kind: b.kind,
                name: String(
                  b.name ?? ""
                ),
                description:
                  b.description,
                priceCents:
                  b.priceCents,
                license:
                  b.license,
                payload:
                  b.payload,
              }
            ),
        },
        requestId
      );
    }

    const creatorModeration =
      match(
        url.pathname,
        /^\/api\/v1\/creator-marketplace\/products\/([^/]+)\/moderate$/
      );

    if (
      creatorModeration &&
      req.method === "POST"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        200,
        {
          product:
            await moderateCreatorProduct(
              db,
              userId,
              creatorModeration[1],
              Boolean(b.approved),
              config.adminEmails
            ),
        },
        requestId
      );
    }

    const creatorPurchase =
      match(
        url.pathname,
        /^\/api\/v1\/creator-marketplace\/products\/([^/]+)\/purchase$/
      );

    if (
      creatorPurchase &&
      req.method === "POST"
    ) {
      return json(
        res,
        200,
        await purchaseCreatorProduct(
          db,
          userId,
          creatorPurchase[1]
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/referrals/code"
    ) {
      return json(
        res,
        200,
        await createReferralCode(
          db,
          userId
        ),
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/referrals/redeem"
    ) {
      const b = await bodyJson(req);

      return json(
        res,
        200,
        await redeemReferralCode(
          db,
          userId,
          String(b.code ?? "")
        ),
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/usage/status"
    ) {
      const projectCount = (
        await db.find(
          "projects",
          (p) =>
            p.ownerUserId ===
              userId &&
            !p.deletedAt
        )
      ).length;

      const storageBytes = (
        await db.find(
          "assets",
          (a) =>
            a.ownerUserId ===
            userId
        )
      ).reduce(
        (total, asset) =>
          total +
          Math.max(
            0,
            Number(asset.size) || 0
          ),
        0
      );

      const storageLimit =
        entitlementsForUser?.limits
          .storageBytes ??
        PLAN_CATALOG.free
          .storageBytes;

      const nextDay = new Date();
      nextDay.setUTCHours(
        24,
        0,
        0,
        0
      );

      const nextMonth = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth() +
            1,
          1
        )
      );

      const limits = {
        ...usageLimits,
        storageBytes:
          storageLimit,
      };

      const usage = {
        cloudProjects:
          projectCount,
        monthlyExports:
          monthlyExportCount,
        dailyAi: dailyAiCount,
        storageBytes,
      };

      return json(
        res,
        200,
        {
          plan:
            entitlementsForUser?.plan ??
            "free",
          planName:
            PLAN_CATALOG[
              entitlementsForUser?.plan ??
                "free"
            ]?.name ?? "Free",
          usage,
          limits,
          remaining: {
            cloudProjects:
              Math.max(
                0,
                limits.cloudProjects -
                  projectCount
              ),
            monthlyExports:
              Math.max(
                0,
                limits.monthlyExports -
                  monthlyExportCount
              ),
            dailyAi:
              Math.max(
                0,
                limits.dailyAi -
                  dailyAiCount
              ),
            storageBytes:
              Math.max(
                0,
                storageLimit -
                  storageBytes
              ),
          },
          resets: {
            dailyAiAt:
              nextDay.toISOString(),
            monthlyExportsAt:
              nextMonth.toISOString(),
          },
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/usage/authorize-export"
    ) {
      const b = await bodyJson(req);

      const formats = (
        Array.isArray(b.formats)
          ? b.formats
          : [b.format]
      )
        .map((value: unknown) =>
          String(value ?? "")
            .toLowerCase()
        )
        .filter(Boolean);

      if (
        monthlyExportCount >=
        usageLimits.monthlyExports
      ) {
        return json(
          res,
          402,
          {
            error: {
              code:
                "EXPORT_LIMIT_REACHED",
              message: `You have reached your ${usageLimits.monthlyExports} monthly exports. Upgrade to continue exporting.`,
            },
          },
          requestId
        );
      }

      const blocked =
        formats.find(
          (format: string) =>
            !usageLimits.standardFormats.includes(
              format
            )
        );

      if (blocked) {
        return json(
          res,
          402,
          {
            error: {
              code:
                "FORMAT_NOT_INCLUDED",
              message: `${blocked.toUpperCase()} export is not included in your current plan.`,
            },
          },
          requestId
        );
      }

      await db.insert(
        "auditEvents",
        {
          organizationId:
            membershipForUser?.organizationId,
          actorUserId: userId,
          action:
            "usage.export",
          requestId,
          metadata: {
            period: monthKey,
            formats,
          },
        }
      );

      return json(
        res,
        200,
        {
          authorized: true,
          remaining:
            Math.max(
              0,
              usageLimits.monthlyExports -
                monthlyExportCount -
                1
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/me"
    ) {
      const user =
        await db.get(
          "users",
          userId
        );

      return user
        ? json(
            res,
            200,
            {
              user:
                publicUser(user),
              isAdmin:
                isConfiguredAdmin(
                  user.email,
                  config.adminEmails
                ),
            },
            requestId
          )
        : json(
            res,
            404,
            {
              error: {
                code:
                  "NOT_FOUND",
                message:
                  "User not found",
              },
            },
            requestId
          );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/license/status"
    ) {
      const token = String(
        req.headers[
          "x-license-token"
        ] ?? ""
      );

      return json(
        res,
        200,
        {
          license:
            verifyLicense(
              token,
              config.licenseSigningSecret ??
                ""
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/admin/commercial-diagnostics"
    ) {
      const user =
        await db.get(
          "users",
          userId
        );

      if (
        !user ||
        !isConfiguredAdmin(
          user.email,
          config.adminEmails
        )
      ) {
        return json(
          res,
          403,
          {
            error: {
              code:
                "ADMIN_REQUIRED",
              message:
                "Administrator access required",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          diagnostics:
            commercialDiagnostics(),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/admin/status"
    ) {
      const user =
        await db.get(
          "users",
          userId
        );

      if (
        !user ||
        !isConfiguredAdmin(
          user.email,
          config.adminEmails
        )
      ) {
        return json(
          res,
          403,
          {
            error: {
              code:
                "ADMIN_REQUIRED",
              message:
                "Administrator access required",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          admin: true,
          email: user.email,
          configurationIssues:
            validateProductionConfig(
              config
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/workspaces"
    ) {
      const memberships =
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        );

      const orgs = new Set(
        memberships.map(
          (m) =>
            m.organizationId
        )
      );

      return json(
        res,
        200,
        {
          items:
            await db.find(
              "workspaces",
              (w) =>
                orgs.has(
                  w.organizationId
                )
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/projects"
    ) {
      return json(
        res,
        200,
        {
          items:
            await db.find(
              "projects",
              (p) =>
                p.ownerUserId ===
                  userId &&
                !p.deletedAt
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/projects"
    ) {
      const existingProjects =
        await db.find(
          "projects",
          (p) =>
            p.ownerUserId ===
              userId &&
            !p.deletedAt
        );

      if (
        existingProjects.length >=
        usageLimits.cloudProjects
      ) {
        return json(
          res,
          402,
          {
            error: {
              code:
                "PROJECT_LIMIT_REACHED",
              message: `You have reached your ${usageLimits.cloudProjects} cloud-project limit. Upgrade to save more projects.`,
            },
          },
          requestId
        );
      }

      const b = await bodyJson(req);

      await requireWorkspaceAccess(
        db,
        userId,
        String(b.workspaceId),
        true
      );

      const project =
        await db.insert(
          "projects",
          {
            workspaceId: String(
              b.workspaceId
            ),
            ownerUserId: userId,
            name: String(
              b.name ??
                "Untitled Project"
            ),
            revision: 1,
            payload:
              b.payload ?? {},
          }
        );

      await db.insert(
        "versions",
        {
          projectId: project.id,
          revision: 1,
          payload: project.payload,
          actorUserId: userId,
        }
      );

      return json(
        res,
        201,
        { project },
        requestId
      );
    }

    const projectMatch = match(
      url.pathname,
      /^\/api\/v1\/projects\/([^/]+)$/
    );

    if (
      projectMatch &&
      req.method === "PUT"
    ) {
      const id = projectMatch[1];

      const current =
        await db.get(
          "projects",
          id
        );

      if (
        !current ||
        current.ownerUserId !==
          userId
      ) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NOT_FOUND",
              message:
                "Project not found",
            },
          },
          requestId
        );
      }

      const b = await bodyJson(req);

      if (
        Number(b.baseRevision) !==
        current.revision
      ) {
        return json(
          res,
          409,
          {
            error: {
              code:
                "REVISION_CONFLICT",
              message:
                "Project changed on another device",
            },
            project: current,
          },
          requestId
        );
      }

      const project =
        await db.update(
          "projects",
          id,
          {
            name:
              b.name ??
              current.name,
            payload:
              b.payload ??
              current.payload,
            revision:
              current.revision +
              1,
          }
        );

      await db.insert(
        "versions",
        {
          projectId: id,
          revision:
            project.revision,
          payload:
            project.payload,
          actorUserId: userId,
        }
      );

      return json(
        res,
        200,
        { project },
        requestId
      );
    }

    if (
      projectMatch &&
      req.method === "DELETE"
    ) {
      const current =
        await db.get(
          "projects",
          projectMatch[1]
        );

      if (
        !current ||
        current.ownerUserId !==
          userId
      ) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NOT_FOUND",
              message:
                "Project not found",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          project:
            await db.update(
              "projects",
              current.id,
              {
                deletedAt:
                  new Date().toISOString(),
              }
            ),
        },
        requestId
      );
    }

    const versionsMatch =
      match(
        url.pathname,
        /^\/api\/v1\/projects\/([^/]+)\/versions$/
      );

    if (
      versionsMatch &&
      req.method === "GET"
    ) {
      const project =
        await db.get(
          "projects",
          versionsMatch[1]
        );

      if (
        !project ||
        project.ownerUserId !==
          userId
      ) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NOT_FOUND",
              message:
                "Project not found",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          items: (
            await db.find(
              "versions",
              (v) =>
                v.projectId ===
                project.id
            )
          ).sort(
            (a, b) =>
              b.revision -
              a.revision
          ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/security/csrf"
    ) {
      return json(
        res,
        200,
        {
          csrfToken:
            createCsrfToken(
              claims.sid,
              securityConfig.sessionSecret
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/assets/upload-plan"
    ) {
      const b = await bodyJson(req);

      await requireWorkspaceAccess(
        db,
        userId,
        String(b.workspaceId),
        true
      );

      const uploadCheck =
        validateUpload({
          name: String(
            b.name ?? ""
          ),
          contentType: String(
            b.contentType ??
              "application/octet-stream"
          ),
          size: Number(
            b.size ?? 0
          ),
          checksum: String(
            b.checksum ?? ""
          ),
        });

      if (!uploadCheck.valid) {
        return json(
          res,
          400,
          {
            error: {
              code:
                "UNSAFE_UPLOAD",
              message:
                "Upload rejected",
              details:
                uploadCheck.issues,
            },
          },
          requestId
        );
      }

      const plan =
        await storage.createUploadPlan(
          {
            workspaceId:
              String(
                b.workspaceId
              ),
            name: String(
              b.name
            ),
            contentType:
              String(
                b.contentType ??
                  "application/octet-stream"
              ),
            size: Number(
              b.size ?? 0
            ),
          }
        );

      return json(
        res,
        201,
        { upload: plan },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/assets/complete"
    ) {
      const b = await bodyJson(req);

      await requireWorkspaceAccess(
        db,
        userId,
        String(b.workspaceId),
        true
      );

      const currentStorage = (
        await db.find(
          "assets",
          (a) =>
            a.ownerUserId ===
            userId
        )
      ).reduce(
        (total, asset) =>
          total +
          Math.max(
            0,
            Number(asset.size) || 0
          ),
        0
      );

      const incomingSize =
        Math.max(
          0,
          Number(b.size) || 0
        );

      const storageLimit =
        entitlementsForUser?.limits
          .storageBytes ??
        PLAN_CATALOG.free
          .storageBytes;

      if (
        currentStorage +
          incomingSize >
        storageLimit
      ) {
        return json(
          res,
          402,
          {
            error: {
              code:
                "STORAGE_LIMIT_REACHED",
              message:
                "Your cloud storage limit has been reached. Remove assets or upgrade your plan.",
            },
          },
          requestId
        );
      }

      const asset =
        await db.insert(
          "assets",
          {
            workspaceId:
              String(
                b.workspaceId
              ),
            ownerUserId: userId,
            name: String(b.name),
            mimeType:
              String(
                b.contentType
              ),
            size: incomingSize,
            storageKey:
              String(b.key),
            checksum:
              b.checksum,
          }
        );

      return json(
        res,
        201,
        { asset },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/billing/plans"
    ) {
      return json(
        res,
        200,
        {
          items:
            Object.values(
              PLAN_CATALOG
            ).map((plan) => ({
              id: plan.id,
              name: plan.name,
              monthlyCents:
                plan.monthlyCents,
              features:
                plan.features,
            })),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/billing/entitlements"
    ) {
      const membership = (
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        )
      )[0];

      if (!membership) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NO_ORGANIZATION",
              message:
                "Organization not found",
            },
          },
          requestId
        );
      }

      const org =
        await db.get(
          "organizations",
          membership.organizationId
        );

      const sub = (
        await db.find(
          "subscriptions",
          (s) =>
            s.organizationId ===
            membership.organizationId
        )
      )[0];

      return json(
        res,
        200,
        {
          entitlements:
            resolveEntitlements(
              org!,
              sub
            ),
        },
        requestId
      );
    }

    if (
      req.method === "GET" &&
      url.pathname ===
        "/api/v1/billing/status"
    ) {
      const membership = (
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        )
      )[0];

      if (!membership) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NO_ORGANIZATION",
              message:
                "Organization not found",
            },
          },
          requestId
        );
      }

      const org =
        await db.get(
          "organizations",
          membership.organizationId
        );

      const sub = (
        await db.find(
          "subscriptions",
          (s) =>
            s.organizationId ===
            membership.organizationId
        )
      )[0];

      const ent =
        resolveEntitlements(
          org!,
          sub
        );

      return json(
        res,
        200,
        {
          plan: ent.plan,
          planName:
            PLAN_CATALOG[
              ent.plan
            ].name,
          status:
            sub?.status ??
            "active",
          customerConfigured:
            Boolean(
              sub?.providerCustomerId
            ),
          subscriptionConfigured:
            Boolean(
              sub?.providerSubscriptionId
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/ai/generate"
    ) {
      if (
        dailyAiCount >=
        usageLimits.dailyAi
      ) {
        return json(
          res,
          402,
          {
            error: {
              code:
                "AI_LIMIT_REACHED",
              message: `You have reached your ${usageLimits.dailyAi} daily AI generations. Upgrade or try again tomorrow.`,
            },
          },
          requestId
        );
      }

      const b = await bodyJson(req);

      const membership = (
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        )
      )[0];

      if (!membership) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NO_ORGANIZATION",
              message:
                "Organization not found",
            },
          },
          requestId
        );
      }

      const org =
        await db.get(
          "organizations",
          membership.organizationId
        );

      const sub = (
        await db.find(
          "subscriptions",
          (x) =>
            x.organizationId ===
            membership.organizationId
        )
      )[0];

      const ent =
        resolveEntitlements(
          org!,
          sub
        );

      const result =
        await runAiGateway(
          db,
          {
            ...b,
            userId,
            organizationId:
              membership.organizationId,
            plan: ent.plan,
          }
        );

      await db.insert(
        "auditEvents",
        {
          organizationId:
            membership.organizationId,
          actorUserId: userId,
          action: "usage.ai",
          requestId,
          metadata: {
            period: dayKey,
          },
        }
      );

      return json(
        res,
        200,
        result,
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/billing/checkout"
    ) {
      const b = await bodyJson(req);

      for (const candidate of [
        String(
          b.successUrl ?? ""
        ),
        String(
          b.cancelUrl ?? ""
        ),
      ]) {
        const target =
          new URL(candidate);

        if (
          !isOriginAllowed(
            target.origin,
            securityConfig.publicOrigins
          )
        ) {
          return json(
            res,
            400,
            {
              error: {
                code:
                  "UNSAFE_CHECKOUT_URL",
                message:
                  "Checkout return URL is not allowed",
              },
            },
            requestId
          );
        }
      }

      const membership = (
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        )
      )[0];

      if (!membership) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NO_ORGANIZATION",
              message:
                "Organization not found",
            },
          },
          requestId
        );
      }

      const selection =
        validateCheckoutSelection(
          {
            plan: String(
              b.plan ?? ""
            ),
            quantity:
              b.quantity,
            successUrl:
              String(
                b.successUrl ??
                  ""
              ),
            cancelUrl:
              String(
                b.cancelUrl ??
                  ""
              ),
          }
        );

      let sub = (
        await db.find(
          "subscriptions",
          (x) =>
            x.organizationId ===
            membership.organizationId
        )
      )[0];

      if (!sub) {
        sub =
          await db.insert(
            "subscriptions",
            {
              organizationId:
                membership.organizationId,
              plan: "free",
              status: "active",
              seats: 1,
            }
          );
      }

      let customerId =
        sub.providerCustomerId;

      if (!customerId) {
        const user =
          await db.get(
            "users",
            userId
          );

        const customer =
          await createCustomer(
            user?.email ?? "",
            undefined,
            {
              organizationId:
                membership.organizationId,
              userId,
            }
          );

        customerId =
          String(customer.id);

        sub = (
          await db.update(
            "subscriptions",
            sub.id,
            {
              providerCustomerId:
                customerId,
            }
          )
        )!;
      }

      const session =
        await createCheckoutSession(
          {
            customerId,
            priceId:
              selection.priceId,
            quantity:
              selection.quantity,
            successUrl:
              String(
                b.successUrl
              ),
            cancelUrl:
              String(
                b.cancelUrl
              ),
            organizationId:
              membership.organizationId,
            plan:
              selection.plan,
          }
        );

      return json(
        res,
        200,
        {
          id: session.id,
          url: session.url,
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/billing/portal"
    ) {
      const b = await bodyJson(req);

      const membership = (
        await db.find(
          "memberships",
          (m) =>
            m.userId === userId
        )
      )[0];

      if (!membership) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NO_ORGANIZATION",
              message:
                "Organization not found",
            },
          },
          requestId
        );
      }

      const sub = (
        await db.find(
          "subscriptions",
          (x) =>
            x.organizationId ===
            membership.organizationId
        )
      )[0];

      if (
        !sub?.providerCustomerId
      ) {
        return json(
          res,
          409,
          {
            error: {
              code:
                "BILLING_CUSTOMER_REQUIRED",
              message:
                "Start a paid plan before opening the billing portal.",
            },
          },
          requestId
        );
      }

      const returnUrl =
        String(
          b.returnUrl ?? ""
        );

      const parsed =
        new URL(returnUrl);

      if (
        (parsed.protocol !==
          "https:" &&
          parsed.hostname !==
            "localhost") ||
        !isOriginAllowed(
          parsed.origin,
          securityConfig.publicOrigins
        )
      ) {
        return json(
          res,
          400,
          {
            error: {
              code:
                "UNSAFE_RETURN_URL",
              message:
                "Billing return URL is not allowed",
            },
          },
          requestId
        );
      }

      const portal =
        await createBillingPortal(
          sub.providerCustomerId,
          returnUrl
        );

      return json(
        res,
        200,
        {
          id: portal.id,
          url: portal.url,
        },
        requestId
      );
    }

    const collabJoin = match(
      url.pathname,
      /^\/api\/v1\/collaboration\/([^/]+)\/join$/
    );

    if (
      collabJoin &&
      req.method === "POST"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabJoin[1],
        false
      );

      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          session:
            await joinCollaboration(
              {
                projectId:
                  collabJoin[1],
                userId,
                displayName:
                  String(
                    b.displayName ??
                      "Collaborator"
                  ),
                color: String(
                  b.color ??
                    "#f97316"
                ),
                selectionIds: [],
              }
            ),
        },
        requestId
      );
    }

    const collabPresence =
      match(
        url.pathname,
        /^\/api\/v1\/collaboration\/([^/]+)\/presence$/
      );

    if (
      collabPresence &&
      req.method === "GET"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabPresence[1],
        false
      );

      return json(
        res,
        200,
        {
          items:
            await listPresence(
              collabPresence[1]
            ),
        },
        requestId
      );
    }

    const collabSession =
      match(
        url.pathname,
        /^\/api\/v1\/collaboration\/sessions\/([^/]+)$/
      );

    if (
      collabSession &&
      req.method === "PUT"
    ) {
      return json(
        res,
        200,
        {
          session:
            await updatePresence(
              collabSession[1],
              userId,
              await bodyJson(req)
            ),
        },
        requestId
      );
    }

    const collabOps = match(
      url.pathname,
      /^\/api\/v1\/collaboration\/([^/]+)\/operations$/
    );

    if (
      collabOps &&
      req.method === "GET"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabOps[1],
        false
      );

      return json(
        res,
        200,
        {
          items:
            await listOperations(
              collabOps[1],
              Number(
                url.searchParams.get(
                  "afterRevision"
                ) ?? 0
              )
            ),
        },
        requestId
      );
    }

    if (
      collabOps &&
      req.method === "POST"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabOps[1],
        true
      );

      const b = await bodyJson(req);

      return json(
        res,
        200,
        await applyCollaborationOperation(
          db,
          {
            projectId:
              collabOps[1],
            actorUserId:
              userId,
            baseRevision:
              Number(
                b.baseRevision
              ),
            kind:
              b.kind ??
              "patch",
            payload:
              b.payload,
          }
        ),
        requestId
      );
    }

    const collabComments =
      match(
        url.pathname,
        /^\/api\/v1\/collaboration\/([^/]+)\/comments$/
      );

    if (
      collabComments &&
      req.method === "GET"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabComments[1],
        false
      );

      return json(
        res,
        200,
        {
          items:
            await listComments(
              collabComments[1]
            ),
        },
        requestId
      );
    }

    if (
      collabComments &&
      req.method === "POST"
    ) {
      await requireProjectAccess(
        db,
        userId,
        collabComments[1],
        true
      );

      const b = await bodyJson(req);

      return json(
        res,
        201,
        {
          comment:
            await createComment(
              {
                projectId:
                  collabComments[1],
                authorUserId:
                  userId,
                body: String(
                  b.body ?? ""
                ),
                mentions:
                  b.mentions,
                parentId:
                  b.parentId,
              }
            ),
        },
        requestId
      );
    }

    const resolveCommentMatch =
      match(
        url.pathname,
        /^\/api\/v1\/collaboration\/([^/]+)\/comments\/([^/]+)\/resolve$/
      );

    if (
      resolveCommentMatch &&
      req.method === "POST"
    ) {
      await requireProjectAccess(
        db,
        userId,
        resolveCommentMatch[1],
        true
      );

      return json(
        res,
        200,
        {
          comment:
            await resolveComment(
              resolveCommentMatch[1],
              resolveCommentMatch[2],
              true
            ),
        },
        requestId
      );
    }

    const approvalsMatch =
      match(
        url.pathname,
        /^\/api\/v1\/collaboration\/([^/]+)\/approvals$/
      );

    if (
      approvalsMatch &&
      req.method === "GET"
    ) {
      await requireProjectAccess(
        db,
        userId,
        approvalsMatch[1],
        false
      );

      return json(
        res,
        200,
        {
          items:
            await listApprovals(
              approvalsMatch[1]
            ),
        },
        requestId
      );
    }

    if (
      approvalsMatch &&
      req.method === "POST"
    ) {
      await requireProjectAccess(
        db,
        userId,
        approvalsMatch[1],
        true
      );

      const b = await bodyJson(req);

      return json(
        res,
        200,
        {
          approval:
            await setApproval(
              {
                projectId:
                  approvalsMatch[1],
                reviewerUserId:
                  userId,
                status:
                  b.status ??
                  "requested",
                note: b.note,
              }
            ),
        },
        requestId
      );
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/exports"
    ) {
      const b = await bodyJson(req);

      await requireProjectAccess(
        db,
        userId,
        String(b.projectId),
        false
      );

      await requireWorkspaceAccess(
        db,
        userId,
        String(b.workspaceId),
        false
      );

      return json(
        res,
        202,
        {
          job:
            await createExportJob(
              db,
              {
                ...b,
                userId,
              }
            ),
        },
        requestId
      );
    }

    const exportMatch = match(
      url.pathname,
      /^\/api\/v1\/exports\/([^/]+)$/
    );

    if (
      exportMatch &&
      req.method === "GET"
    ) {
      const job =
        await db.get(
          "jobs",
          exportMatch[1]
        );

      const payload =
        job?.payload as
          | {
              userId?: string;
            }
          | undefined;

      if (
        !job ||
        payload?.userId !== userId
      ) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NOT_FOUND",
              message:
                "Export job not found",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          job,
          manifest:
            job.status ===
            "succeeded"
              ? buildExportManifest(
                  job
                )
              : undefined,
        },
        requestId
      );
    }

    const exportAction =
      match(
        url.pathname,
        /^\/api\/v1\/exports\/([^/]+)\/(cancel|retry)$/
      );

    if (
      exportAction &&
      req.method === "POST"
    ) {
      const job =
        await db.get(
          "jobs",
          exportAction[1]
        );

      const payload =
        job?.payload as
          | {
              userId?: string;
            }
          | undefined;

      if (
        !job ||
        payload?.userId !== userId
      ) {
        return json(
          res,
          404,
          {
            error: {
              code:
                "NOT_FOUND",
              message:
                "Export job not found",
            },
          },
          requestId
        );
      }

      return json(
        res,
        200,
        {
          job:
            exportAction[2] ===
            "cancel"
              ? await cancelExportJob(
                  db,
                  exportAction[1]
                )
              : await retryExportJob(
                  db,
                  exportAction[1]
                ),
        },
        requestId
      );
    }

    return json(
      res,
      404,
      {
        error: {
          code: "NOT_FOUND",
          message:
            "Route not found",
        },
      },
      requestId
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        path: req.url,
        message,
      })
    );

    const clientErrors =
      new Set([
        "INVALID_CHECKOUT_PLAN",
        "INVALID_CHECKOUT_QUANTITY",
        "UNSAFE_CHECKOUT_URL",
        "UNSAFE_RETURN_URL",
        "PLAN_NOT_PURCHASABLE",
      ]);

    const configErrors =
      new Set([
        "STRIPE_NOT_CONFIGURED",
        "STRIPE_PRICE_NOT_CONFIGURED",
        "STRIPE_WEBHOOK_SECRET_MISSING",
      ]);

    const status =
      message ===
      "PAYLOAD_TOO_LARGE"
        ? 413
        : clientErrors.has(message)
          ? 400
          : configErrors.has(
                message
              )
            ? 503
            : 500;

    const publicMessage =
      status < 500
        ? message
            .replaceAll("_", " ")
            .toLowerCase()
        : status === 503
          ? "Billing is not configured yet."
          : process.env.NODE_ENV ===
              "production"
            ? "Internal server error"
            : message;

    return json(
      res,
      status,
      {
        error: {
          code: message,
          message:
            publicMessage,
        },
      },
      requestId
    );
  }
}

export function createApiServer() {
  return createServer(
    handleRequest
  );
}

async function startApiServer() {
  // Wait for Redis / collaboration storage before accepting traffic.
  await collaborationStoreReady;

  const issues =
    validateProductionConfig(
      config
    );

  if (
    issues.length &&
    process.env.NODE_ENV ===
      "production"
  ) {
    throw new Error(
      issues.join("; ")
    );
  }

  const port = Number(
    process.env.PORT ?? 4100
  );

  const server =
    createApiServer();

  server.headersTimeout =
    Math.max(
      config.requestTimeoutMs +
        5000,
      10000
    );

  server.requestTimeout =
    config.requestTimeoutMs;

  server.keepAliveTimeout =
    5000;

  // Verify database connectivity before Render marks the API as running.
  const db =
    await getDatabase();

  installGracefulShutdown({
    server,
    database: db,
    timeoutMs:
      config.shutdownTimeoutMs,
  });

  server.listen(
    port,
    "0.0.0.0",
    () => {
      console.log(
        JSON.stringify({
          level: "info",
          message:
            "Yaposan Publisher v1.0.0 API listening",
          version:
            releaseVersion,
          port,
          host: "0.0.0.0",
          buildId:
            process.env.BUILD_ID ??
            "local",
          commitSha:
            process.env
              .GIT_COMMIT_SHA ??
            "unknown",
        })
      );
    }
  );
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replace(
      /\\/g,
      "/"
    )
  )
) {
  startApiServer().catch(
    (error) => {
      console.error(
        JSON.stringify({
          level: "error",
          message:
            "Yaposan API startup failed",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        })
      );

      process.exit(1);
    }
  );
}