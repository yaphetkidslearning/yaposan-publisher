import { createHash, randomBytes, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  claimNextProductPhotoBatch,
  cleanupExpiredProductPhotoBatches,
  createProductPhotoBatch,
  getProductPhotoBatch,
  getProductPhotoBatchZip,
  listProductPhotoBatches,
  processProductPhotoBatch,
  productPhotoBatchMetrics,
  recoverStaleProductPhotoBatches,
  retryProductPhotoBatch,
  startProductPhotoBatch,
  uploadProductPhotoBatchItem,
} from "./productPhotoBatches";
import { loadBackgroundRemovalConfig, runSelfHostedBackgroundRemoval, runSelfHostedProductPhotoAnalysis } from "./backgroundRemoval";

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { runAiGateway } from "./aiPlatform";
import { cancelMediaJob, generateMedia, getMediaJob, mediaProviderCapabilities } from "./mediaGeneration";
import {
  constantTimeEqual,
  requireProjectAccess,
  requireWorkspaceAccess,
} from "./authorization";
import { AI_CREDIT_PACKS, applyStripeCreditReversal, creditBalance, getCreditPack, grantPurchasedCredits } from "./aiCredits";
import { communityBudgetStatus } from "./aiCostControls";
import { deleteProviderCredential, listProviderCredentials, loadProviderCredential, rotateProviderCredentials, saveProviderCredential, testProviderCredential } from "./providerVault";
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
  organizationSummary,
  changeMemberRole,
  createShareLink,
  resolveShareLink,
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
  moderateCreatorProductAsAdmin,
  purchaseCreatorProduct,
  redeemReferralCode,
  submitCreatorProduct,
} from "./creatorMarketplace";
import { getDatabase } from "./database";
import { createSpace, listUserSpaces, requireSpaceAccess, updateSpace } from "./spaces";
import { createSpaceComment, createSpacePost, getSpaceSocial, toggleSpaceCommentReaction, toggleSpaceFollow } from "./spaceSocial";
import { getPublicProfile, togglePublicFollow, getExploreFeed, searchSocial, getHashtagFeed } from "./social109";
import { uploadSocialMedia, attachPostMedia, createStory, getActiveStories, viewStory, createHighlight, createReel, getReelsFeed } from "./social110";
import { createCommunity, listCommunities, joinCommunity, createCommunityPost, moderateCommunity, createSocialPage, listSocialPages, createSocialEvent, listUpcomingEvents, rsvpEvent, createLiveSession, startLiveSession, endLiveSession, listLiveSessions, sendLiveChat, reactLive } from "./social111";
import { createAiSocialProfile, listAiSocialProfiles, socialAiAssist, aiSocialSearch, aiSocialRecommendations, labelAiGeneratedPost, createAiModerationSuggestion } from "./social112";
import { createMembershipPlan, listMembershipPlans, beginMembershipSubscription, createTip, setPaidPost, beginPaidPostUnlock, creatorEconomyDashboard, settleCreatorEconomyStripe, linkPaidCommunity } from "./social113";
import { updateAdSettings, publicAdOffer, createAdCampaign, settleAdCampaignStripe, listCreatorAdCampaigns, decideAdCampaign, selectPublicAd, recordAdClick, creatorAdDashboard, visitorKey } from "./social114";
import { createConversation, createOwnerConversation, getTrendingHashtags, listConversations, listGlobalDmInbox, listMessages, listSocialNotifications, markConversationRead, markNotificationRead, reportSocialContent, sendMessage, togglePostBookmark, togglePostReaction, togglePostRepost, toggleUserBlock } from "./social108";
import { createSpaceAI, createSpaceCompute, createSpaceConnection, getSpaceResources } from "./spaceResources";
import { getYaposanToolCatalog } from "./toolRegistry";
import { createStudio, getStudio, getStudioRun, listStudioRuns, listStudios, planStudioRun, retryStudioRun, runStudio, updateStudio } from "./studioRuntime";
import { getPublicCreator, publishSpace } from "./publicCreator";
import { getSpacePrivacy, setResourceVisibility, updateConnectionDataGrant, updateSpacePrivacy, type PrivacyResourceType } from "./privacy";
import { acceptSpaceInvite, createStoreOrder, createStoreProduct, getSpaceStore, getSpaceTeam, inviteSpaceMember, listMySpaceInvites, removeSpaceMember, revokeSpaceInvite, updateSpaceMemberRole, updateStoreProduct } from "./spaceCommerce";
import { GPU_CREDIT_PACKS, attachMarketplaceCheckout, createMarketplaceOrder, creatorEarningsDashboard, gpuCreditBalance, grantPurchasedGPUCredits, installMarketplaceProduct, listMarketplace, myMarketplaceLibrary, myUsageAndBilling, settleMarketplaceCheckout } from "./commerce";
import { authenticateAdmin, createAdminPrincipal, listAdminPrincipals, publicAdmin, requireAdmin, revokeAdminSession, setAdminPrincipalStatus, type AdminPermission } from "./adminAuth";
import { adminAIGPU, adminAudit, adminFinance, adminInfrastructure, adminMarketplace, adminModeration, adminOverview, adminSecurity, adminSpaces, adminUsers, createCreatorPayout, moderateMarketplaceProduct, recordPlatformCost, setAdminSpaceStatus, setAdminUserStatus } from "./admin";
import { adminPageTemplatePreview, adminPaymentHealth, adminSpacePreview, claimStripeWebhook, finishStripeWebhook, phase115SafetyMatrix, rejectRawPaymentData } from "./trustSafety";
import { adFraudReview, createModerationAppeal, creatorPayoutSafety, enforceAdFraudHold, markAllNotificationsRead, notificationCenter, productionReadiness116, reconcileCreatorPayment, resolveModerationAppeal, setAgeSafetyProfile } from "./production";
import {
  hashPassword,
  issueSession,
  provisionAccount,
  provisionFederatedAccount,
  publicUser,
  verifyPassword,
  verifyToken,
} from "./identity";
import { createUserSession, getOrCreateExternalSession, getSpaceSecurity, listUserSessions, requireActiveUserSession, requireSpaceSensitiveAction, revokeOtherSessions, revokeUserSession, rotateUserSession, securityEventPayload, updateSpaceSecurity } from "./accountSecurity";
import { oidcClientMetadata, verifyOidcBearer } from "./oidcIdentity";
import { adminResetPrincipalPassword, changePassword, requestAdminPasswordReset, requestPasswordReset, resetAdminPasswordWithToken, resetPasswordWithToken, sendVerificationEmail, verifyEmailToken } from "./authRecovery";
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
  createAICreditCheckoutSession,
  createGPUCreditCheckoutSession,
  createMarketplaceCheckoutSession,
  createCreatorOneTimeCheckoutSession,
  createCreatorAdCheckoutSession,
  createCreatorMembershipCheckoutSession,
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
  fetchMetadataAllowed,
  classifyUploadRisk,
} from "./securityPlatform";
import {
  LocalObjectStorage,
  R2ObjectStorage,
  type ObjectStorage,
  storageKeyPrefix,
} from "./storage";

const config = loadCloudConfig();
const runtimeMetrics = new RuntimeMetrics();
const releaseVersion = "119.10.6";

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
        config.localStorageRoot,
        config.publicAssetBaseUrl,
        config.sessionSecret
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

const supportTicketLimiter = new BoundedRateLimiter({
  limit: 5,
  windowMs: 60_000,
  maxEntries: config.rateLimitMaxEntries,
});

const loginIpLimiter = new BoundedRateLimiter({ limit: 20, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const loginAccountLimiter = new BoundedRateLimiter({ limit: 8, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const authRecoveryIpLimiter = new BoundedRateLimiter({ limit: 12, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const authRecoveryAccountLimiter = new BoundedRateLimiter({ limit: 4, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const authTokenIpLimiter = new BoundedRateLimiter({ limit: 30, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const registrationIpLimiter = new BoundedRateLimiter({ limit: 10, windowMs: 60 * 60_000, maxEntries: config.rateLimitMaxEntries });
const registrationAccountLimiter = new BoundedRateLimiter({ limit: 3, windowMs: 60 * 60_000, maxEntries: config.rateLimitMaxEntries });
const adminLoginIpLimiter = new BoundedRateLimiter({ limit: 12, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const adminLoginAccountLimiter = new BoundedRateLimiter({ limit: 6, windowMs: 15 * 60_000, maxEntries: config.rateLimitMaxEntries });
const authAccountKey=(value:string)=>createHash("sha256").update(value.trim().toLowerCase().slice(0,254)||"unknown").digest("hex");
const publicPageLimiter = new BoundedRateLimiter({ limit: 90, windowMs: 60_000, maxEntries: config.rateLimitMaxEntries });
const emitSecurityEvent=(event:ReturnType<typeof securityEventPayload>)=>{if(config.securityEventSink!=="off")console.warn(JSON.stringify(event));};

const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const SUPPORT_ATTACHMENT_MIME_TYPES = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf", "text/plain", "application/json", "application/zip",
]);

const supportAttachmentMatchesMime = (bytes: Buffer, mimeType: string) => {
  if (!bytes.length) return false;
  const head = bytes.subarray(0, 16);
  if (mimeType === "image/png") return head.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (mimeType === "image/jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (mimeType === "image/gif") return head.subarray(0,6).toString("ascii") === "GIF87a" || head.subarray(0,6).toString("ascii") === "GIF89a";
  if (mimeType === "image/webp") return head.subarray(0,4).toString("ascii") === "RIFF" && head.subarray(8,12).toString("ascii") === "WEBP";
  if (mimeType === "application/pdf") return head.subarray(0,5).toString("ascii") === "%PDF-";
  if (mimeType === "application/zip") return head[0] === 0x50 && head[1] === 0x4b && [0x03,0x05,0x07].includes(head[2] ?? -1);
  if (mimeType === "text/plain" || mimeType === "application/json") {
    if (bytes.includes(0)) return false;
    if (mimeType === "application/json") { try { JSON.parse(bytes.toString("utf8")); } catch { return false; } }
    return true;
  }
  return false;
};

const supportTicketStatuses = new Set(["open","in_progress","waiting_for_user","resolved","closed"]);

function rateLimit(ip: string) {
  return !requestLimiter.check(ip).allowed;
}

function isLoopbackAddress(value: string | undefined) {
  const address = String(value ?? "").toLowerCase().replace(/^::ffff:/, "");
  return address === "127.0.0.1" || address === "::1";
}

const localDevTokenPath=resolveLocalDevTokenPath();
let localDevToken="";
function resolveLocalDevTokenPath(){return String(process.env.YAPOSAN_LOCAL_DEV_TOKEN_PATH??".yaposan/local-dev-token").trim()||".yaposan/local-dev-token"}
function initializeLocalDevToken(){
  if(String(process.env.NODE_ENV??"development").trim().toLowerCase()==="production")return;
  localDevToken=randomBytes(32).toString("hex");
  const path=localDevTokenPath;
  const slash=Math.max(path.lastIndexOf("/"),path.lastIndexOf("\\"));
  if(slash>=0)mkdirSync(path.slice(0,slash),{recursive:true});
  writeFileSync(path,localDevToken+"\n",{encoding:"utf8",mode:0o600});
  try{chmodSync(path,0o600)}catch{}
}
function localDevAuthorized(req:IncomingMessage){
  return isLoopbackAddress(req.socket.remoteAddress)&&!!localDevToken&&constantTimeEqual(String(req.headers["x-yaposan-local-dev"]??""),localDevToken);
}

const runtimeConfigKeys = JSON.parse(readFileSync(resolve(process.cwd(), "runtime-config-keys.json"),"utf8")) as string[];
function localRuntimeConfigFingerprint() {
  const api = String(process.env.EXPO_PUBLIC_API_URL ?? process.env.PUBLIC_API_URL ?? "http://localhost:4100").replace(/\/$/, "");
  const web = String(process.env.PUBLIC_WEB_URL ?? process.env.PUBLIC_APP_URL ?? "http://localhost:8081").replace(/\/$/, "");
  const origins = String(process.env.PUBLIC_ORIGINS ?? "http://localhost:8081,http://127.0.0.1:8081")
    .split(",").map(x => x.trim().replace(/\/$/, "").toLowerCase()).filter(Boolean).join(",");
  const effective=(key:string)=>{
    if(key==="EXPO_PUBLIC_API_URL")return api;
    if(key==="PUBLIC_API_URL")return String(process.env.PUBLIC_API_URL || api);
    if(key==="PUBLIC_WEB_URL")return String(process.env.PUBLIC_WEB_URL || web);
    if(key==="PUBLIC_APP_URL")return String(process.env.PUBLIC_APP_URL || web);
    if(key==="PUBLIC_ORIGINS")return origins;
    if(key==="PORT")return String(process.env.PORT ?? "4100");
    if(key==="YAPOSAN_LOCAL_DB_PATH")return String(process.env.YAPOSAN_LOCAL_DB_PATH || ".yaposan/local-database.json");
    if(key==="YAPOSAN_LOCAL_DB_LOCK_TIMEOUT_MS")return String(process.env.YAPOSAN_LOCAL_DB_LOCK_TIMEOUT_MS || "30000");
    if(key==="YAPOSAN_LOCAL_DB_STALE_LOCK_MS")return String(process.env.YAPOSAN_LOCAL_DB_STALE_LOCK_MS || "300000");
    if(key==="YAPOSAN_LOCAL_DB_WARN_BYTES")return String(process.env.YAPOSAN_LOCAL_DB_WARN_BYTES || "26214400");
    if(key==="YAPOSAN_LOCAL_DEV_TOKEN_PATH")return String(process.env.YAPOSAN_LOCAL_DEV_TOKEN_PATH || ".yaposan/local-dev-token");
    if(key==="NODE_ENV")return String(process.env.NODE_ENV || "development");
    if(key==="REQUIRE_EMAIL_VERIFICATION")return String(process.env.REQUIRE_EMAIL_VERIFICATION || "true");
    return String(process.env[key] ?? "");
  };
  const selected=Object.fromEntries([...runtimeConfigKeys].sort().map(key=>[key,createHash("sha256").update(`${key}\0${effective(key)}`).digest("hex")]));
  return createHash("sha256").update(JSON.stringify(selected)).digest("hex").slice(0,24);
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

  // CORS must be established before auth, fetch-metadata checks,
  // and every API error response. This ensures browser clients can read 401/403/404
  // responses and allows the required OPTIONS preflight for JSON/admin requests.
  const requestOrigin = String(req.headers.origin ?? "").trim() || undefined;
  if (!isOriginAllowed(requestOrigin, securityConfig.publicOrigins)) {
    return json(res,403,{error:{code:"ORIGIN_NOT_ALLOWED",message:"Request origin is not trusted"}},requestId);
  }
  if (requestOrigin) {
    res.setHeader("access-control-allow-origin", requestOrigin);
    res.setHeader("vary", "Origin");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-expose-headers", "x-request-id");
  }
  if (req.method === "OPTIONS") {
    const requestedMethod = String(req.headers["access-control-request-method"] ?? "GET").toUpperCase();
    const allowedMethods = ["GET","POST","PUT","PATCH","DELETE","OPTIONS"];
    if (!allowedMethods.includes(requestedMethod)) {
      return json(res,405,{error:{code:"CORS_METHOD_NOT_ALLOWED",message:"Requested CORS method is not allowed."}},requestId);
    }
    res.setHeader("access-control-allow-methods", allowedMethods.join(","));
    res.setHeader("access-control-allow-headers", "Authorization, Content-Type, X-Requested-With, X-Yaposan-Admin-Authorization, X-CSRF-Token, X-Request-Id, X-Yaposan-Client-Request-Id");
    res.setHeader("access-control-max-age", "600");
    res.writeHead(204, securityHeaders(requestId));
    res.end();
    return;
  }

  if(!fetchMetadataAllowed({method:req.method,site:String(req.headers["sec-fetch-site"]??""),mode:String(req.headers["sec-fetch-mode"]??""),dest:String(req.headers["sec-fetch-dest"]??""),trustedOrigin:Boolean(requestOrigin)})){
    emitSecurityEvent(securityEventPayload({type:"request.fetch_metadata_blocked",severity:"medium",requestId,ip,metadata:{method:req.method,path:url.pathname}}));
    return json(res,403,{error:{code:"CROSS_SITE_REQUEST_BLOCKED",message:"Cross-site state-changing request blocked."}},requestId);
  }

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
          runtimeConfigFingerprint:
            process.env.NODE_ENV === "production" ? undefined : localRuntimeConfigFingerprint(),
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

    // bridge local CLI tools to the live development database.
    // This route is impossible in production, accepts only loopback TCP clients,
    // requires an explicit development header, and is only enabled when no persistent DB is configured.
    if (req.method === "POST" && url.pathname === "/api/v1/dev/local-verify-user") {
      if (String(process.env.NODE_ENV ?? "development").toLowerCase() === "production") {
        return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found."}},requestId);
      }
      if (String(process.env.DATABASE_URL ?? "").trim()) {
        return json(res,409,{error:{code:"PERSISTENT_DATABASE_CONFIGURED",message:"Use the direct local verification command with the configured database."}},requestId);
      }
      if (!localDevAuthorized(req)) {
        return json(res,403,{error:{code:"LOCAL_DEVELOPMENT_ONLY",message:"Local verification is available only to the localhost development CLI."}},requestId);
      }
      const b = await bodyJson(req);
      const email = String(b.email ?? "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(res,400,{error:{code:"INVALID_EMAIL",message:"A valid customer email is required."}},requestId);
      const matches = await db.find("users",u=>u.email.trim().toLowerCase()===email);
      if (matches.length !== 1) return json(res,matches.length===0?404:409,{error:{code:matches.length===0?"USER_NOT_FOUND":"AMBIGUOUS_USER",message:matches.length===0?`No Yaposan customer account found for ${email}.`:`Refusing to continue: multiple users matched ${email}.`}},requestId);
      const user = matches[0];
      if ((user.identityProvider ?? "local") !== "local") return json(res,409,{error:{code:"NOT_LOCAL_PASSWORD_ACCOUNT",message:"This command is only for local-password customer accounts."}},requestId);
      const now = new Date().toISOString();
      const pending = await db.find("authTokens",t=>t.subjectType==="user"&&t.subjectId===user.id&&t.purpose==="email_verification"&&!t.usedAt);
      for (const token of pending) await db.update("authTokens",token.id,{usedAt:now});
      if (!user.emailVerified || !user.emailVerifiedAt) await db.update("users",user.id,{emailVerified:true,emailVerifiedAt:user.emailVerifiedAt??now});
      await db.insert("auditEvents",{actorUserId:user.id,action:"user.email.verified_local_development",target:user.id,requestId,metadata:{method:"local_live_api_cli",invalidatedVerificationTokens:pending.length}});
      return json(res,200,{verified:true,email,invalidatedVerificationTokens:pending.length},requestId);
    }

    // local diagnostics and recovery use the same live database as the API.
    if (req.method === "POST" && url.pathname === "/api/v1/dev/local-user-status") {
      if (String(process.env.NODE_ENV ?? "development").toLowerCase() === "production") return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found."}},requestId);
      if (!localDevAuthorized(req)) return json(res,403,{error:{code:"LOCAL_DEVELOPMENT_ONLY",message:"Local account diagnostics are available only to the localhost development CLI."}},requestId);
      const b=await bodyJson(req);const email=String(b.email??"").trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(email))return json(res,400,{error:{code:"INVALID_EMAIL",message:"A valid customer email is required."}},requestId);
      const matches=await db.find("users",u=>u.email.trim().toLowerCase()===email);
      if(matches.length!==1)return json(res,matches.length===0?404:409,{error:{code:matches.length===0?"USER_NOT_FOUND":"AMBIGUOUS_USER",message:matches.length===0?`No Yaposan customer account found for ${email}.`:`Multiple users matched ${email}.`}},requestId);
      const user=matches[0];const memberships=await db.find("memberships",m=>m.userId===user.id);const spaces=await db.find("spaces",sp=>sp.ownerUserId===user.id);const sessions=await db.find("userSessions",x=>x.userId===user.id&&!x.revokedAt);
      return json(res,200,{email:user.email,emailVerified:user.emailVerified,emailVerifiedAt:user.emailVerifiedAt??null,status:user.status,identityProvider:user.identityProvider??"local",organizations:memberships.length,spaces:spaces.map(sp=>({id:sp.id,name:sp.name,slug:sp.slug,status:sp.status,visibility:sp.visibility})),activeSessions:sessions.length,databaseMode:String(process.env.DATABASE_URL??"").trim()?"postgres":(String(process.env.YAPOSAN_IN_MEMORY_ONLY??"").toLowerCase()==="true"?"memory":"local-json")},requestId);
    }

    if (req.method === "POST" && url.pathname === "/api/v1/dev/local-user-password") {
      if (String(process.env.NODE_ENV ?? "development").toLowerCase() === "production") return json(res,404,{error:{code:"NOT_FOUND",message:"Route not found."}},requestId);
      if (!localDevAuthorized(req)) return json(res,403,{error:{code:"LOCAL_DEVELOPMENT_ONLY",message:"Local password recovery is available only to the localhost development CLI."}},requestId);
      const b=await bodyJson(req);const email=String(b.email??"").trim().toLowerCase();const newPassword=String(b.newPassword??"");
      if(!/^\S+@\S+\.\S+$/.test(email))return json(res,400,{error:{code:"INVALID_EMAIL",message:"A valid customer email is required."}},requestId);
      const check=passwordPolicy(newPassword,email);if(!check.valid)return json(res,400,{error:{code:"PASSWORD_POLICY_FAILED",message:"New password does not meet Yaposan security requirements.",details:check.issues}},requestId);
      const matches=await db.find("users",u=>u.email.trim().toLowerCase()===email);if(matches.length!==1)return json(res,matches.length===0?404:409,{error:{code:matches.length===0?"USER_NOT_FOUND":"AMBIGUOUS_USER",message:matches.length===0?`No Yaposan customer account found for ${email}.`:`Multiple users matched ${email}.`}},requestId);
      const user=matches[0];if((user.identityProvider??"local")!=="local")return json(res,409,{error:{code:"NOT_LOCAL_PASSWORD_ACCOUNT",message:"This command is only for local-password customer accounts."}},requestId);
      await db.update("users",user.id,{passwordHash:hashPassword(newPassword)});const now=new Date().toISOString();let revoked=0;for(const sess of await db.find("userSessions",x=>x.userId===user.id&&!x.revokedAt)){await db.update("userSessions",sess.id,{revokedAt:now});revoked++;}
      await db.insert("auditEvents",{actorUserId:user.id,action:"user.password.reset_local_development",target:user.id,requestId,metadata:{method:"local_live_api_cli",revokedSessions:revoked}});
      return json(res,200,{reset:true,email,revokedSessions:revoked},requestId);
    }

    if(req.method === "GET" && url.pathname === "/api/v1/auth/config"){
      return json(res,200,{identityProvider:config.identityProvider,localPasswordEnabled:config.identityProvider==="local"&&!config.requireExternalIdentity,externalIdentityRequired:config.requireExternalIdentity,oidc:await oidcClientMetadata({issuer:config.oidcIssuer,clientId:config.oidcClientId,audience:config.oidcAudience}),recommendedPrimary:"passkey",fallback:"password + authenticator MFA",recovery:"recovery codes"},requestId);
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/auth/register"
    ) {
      if(config.identityProvider==="oidc"||config.requireExternalIdentity)return json(res,409,{error:{code:"EXTERNAL_IDENTITY_REQUIRED",message:"Use the configured identity provider to create your Yaposan account."}},requestId);
      const b = await bodyJson(req);

      const email = String(
        b.email ?? ""
      ).trim().toLowerCase();

      const password = String(
        b.password ?? ""
      );

      if(!registrationIpLimiter.check(ip).allowed||!registrationAccountLimiter.check(authAccountKey(email)).allowed){emitSecurityEvent(securityEventPayload({type:"auth.register.rate_limited",severity:"medium",requestId,ip,metadata:{accountPresented:Boolean(email)}}));return json(res,429,{error:{code:"REGISTRATION_RATE_LIMITED",message:"Too many registration attempts. Try again later."}},requestId);}

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
        return json(res,202,{accepted:true,message:"If this address is eligible, account instructions will be sent."},requestId);
      }

      const account =
        await provisionAccount(db, {
          email,
          password,
          organizationName:
            b.organizationName,
          region: b.region,
        });

      const verification=await sendVerificationEmail(db,account.user);

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
          verificationRequired: config.requireEmailVerification,
          message: !config.requireEmailVerification
            ? "Account created. Email verification is disabled for this environment."
            : verification.sent===false && process.env.NODE_ENV!=="production"
              ? "Email delivery is not configured in this local environment. Use the development user verification command or configure Resend."
              : "Check your email to verify your Yaposan account.",
          verification,
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
      if(config.identityProvider==="oidc"||config.requireExternalIdentity)return json(res,409,{error:{code:"EXTERNAL_IDENTITY_REQUIRED",message:"Use the configured identity provider to sign in."}},requestId);

      const user = (
        await db.find(
          "users",
          (u) =>
            u.email.toLowerCase() ===
            String(
              b.email ?? ""
            ).trim().toLowerCase()
        )
      )[0];

      const loginKey=String(b.email??"").trim().toLowerCase().slice(0,254);
      if(!loginIpLimiter.check(ip).allowed||!loginAccountLimiter.check(authAccountKey(loginKey)).allowed){emitSecurityEvent(securityEventPayload({type:"auth.login.rate_limited",severity:"high",requestId,ip,metadata:{accountHash:loginKey?"present":"missing"}}));return json(res,429,{error:{code:"LOGIN_RATE_LIMITED",message:"Unable to sign in. Try again later."}},requestId);}

      if (
        !user ||
        !verifyPassword(
          String(b.password ?? ""),
          user.passwordHash
        )
      ) {emitSecurityEvent(securityEventPayload({type:"auth.login.failed",severity:"medium",requestId,ip,metadata:{accountPresented:Boolean(loginKey)}}));return json(res,401,{error:{code:"INVALID_CREDENTIALS",message:"Invalid credentials"}},requestId);
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

      if(config.requireEmailVerification&&!user.emailVerified){
        return json(res,403,{error:{code:"EMAIL_VERIFICATION_REQUIRED",message:"Check your email to verify your Yaposan account before signing in."}},requestId);
      }

      return json(
        res,
        200,
        {
          user: publicUser(user),
          ...issueSession(user.id,identityConfig,(await createUserSession(db,user.id,{ip,userAgent:String(req.headers["user-agent"]??""),authMethod:"local_password",assurance:"password",refreshDays:config.refreshTokenDays})).id,1,"password"),
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

      try{const rotated=await rotateUserSession(db,claims);return json(res,200,issueSession(claims.sub,identityConfig,claims.sid,rotated.version,rotated.assurance),requestId)}catch{return json(res,401,{error:{code:"INVALID_REFRESH_TOKEN",message:"Refresh token is invalid, rotated, revoked, or expired"}},requestId)};
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/v1/support/tickets"
    ) {
      const optionalClaims = verifyToken(String(req.headers.authorization ?? ""), identityConfig.secret, "access");
      const limiterKey = optionalClaims?.sub ? `user:${optionalClaims.sub}` : `ip:${ip}`;
      if (!supportTicketLimiter.check(limiterKey).allowed) {
        return json(res, 429, { error: { code: "SUPPORT_RATE_LIMITED", message: "Too many support requests. Please wait before trying again." } }, requestId);
      }

      const b = await bodyJson(req) as {
        name?: string; email?: string; category?: string; priority?: string; subject?: string; message?: string; website?: string;
        source?: string; page?: string; action?: string; diagnostics?: Record<string, unknown>;
        attachment?: { name?: string; mimeType?: string; size?: number; base64?: string; storageKey?: string };
      };
      // Honeypot: bots commonly fill hidden website fields. Return a generic success without persisting spam.
      if (String(b.website ?? "").trim()) return json(res, 201, { ticket: { id: randomUUID(), status: "open", createdAt: new Date().toISOString(), attachmentStored: false } }, requestId);

      const name = String(b.name ?? "").trim().slice(0, 120);
      const email = String(b.email ?? "").trim().toLowerCase().slice(0, 254);
      const category = String(b.category ?? "Bug / Problem").trim().slice(0, 80);
      const priorityRaw = String(b.priority ?? "Normal").trim().toLowerCase();
      const priority = priorityRaw === "urgent" ? "urgent" : priorityRaw === "important" ? "important" : "normal";
      const subject = String(b.subject ?? "").trim().slice(0, 240);
      const message = String(b.message ?? "").trim().slice(0, 20_000);

      if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || subject.length < 4 || message.length < 20) {
        return json(res, 400, { error: { code: "INVALID_SUPPORT_REQUEST", message: "Name, valid email, subject, and a detailed description are required." } }, requestId);
      }

      let attachmentStorageKey: string | undefined;
      let attachmentName: string | undefined;
      let attachmentMimeType: string | undefined;
      let attachmentSize: number | undefined;

      if (b.attachment?.storageKey && optionalClaims?.sub) {
        attachmentStorageKey = String(b.attachment.storageKey).slice(0, 500);
        if (!attachmentStorageKey.startsWith(`support-${optionalClaims.sub}/`)) return json(res, 403, { error: { code: "SUPPORT_ATTACHMENT_ACCESS", message: "Attachment does not belong to this support session." } }, requestId);
        attachmentName = String(b.attachment.name ?? "support-attachment").trim().slice(0, 160);
        attachmentMimeType = String(b.attachment.mimeType ?? "application/octet-stream").toLowerCase();
        attachmentSize = Math.max(0, Number(b.attachment.size ?? 0));
      } else if (b.attachment?.base64) {
        attachmentName = String(b.attachment.name ?? "support-attachment").trim().slice(0, 160);
        attachmentMimeType = String(b.attachment.mimeType ?? "application/octet-stream").toLowerCase();
        if (!SUPPORT_ATTACHMENT_MIME_TYPES.has(attachmentMimeType)) return json(res, 400, { error: { code: "SUPPORT_ATTACHMENT_TYPE", message: "Unsupported support attachment type." } }, requestId);
        const encoded = String(b.attachment.base64);
        if (!/^[A-Za-z0-9+/=\r\n]+$/.test(encoded)) return json(res, 400, { error: { code: "SUPPORT_ATTACHMENT_ENCODING", message: "Attachment encoding is invalid." } }, requestId);
        const bytes = Buffer.from(encoded, "base64");
        if (!bytes.length || bytes.length > SUPPORT_ATTACHMENT_MAX_BYTES) return json(res, 400, { error: { code: "SUPPORT_ATTACHMENT_SIZE", message: "Support attachments must be 10 MB or smaller." } }, requestId);
        if (!supportAttachmentMatchesMime(bytes, attachmentMimeType)) return json(res, 400, { error: { code: "SUPPORT_ATTACHMENT_SIGNATURE", message: "Attachment contents do not match the declared file type." } }, requestId);
        const stored = await storage.put({ workspaceId: optionalClaims?.sub ? `support-${optionalClaims.sub}` : "support-public", name: attachmentName, contentType: attachmentMimeType, body: bytes });
        attachmentStorageKey = stored.key;
        attachmentSize = stored.size;
      }

      const ticket = await db.insert("supportTickets", {
        userId: optionalClaims?.sub, email, name, category, priority, subject, message, status: "open",
        source: String(b.source ?? "").slice(0, 160) || undefined, page: String(b.page ?? "").slice(0, 300) || undefined, action: String(b.action ?? "").slice(0, 160) || undefined,
        diagnostics: b.diagnostics && typeof b.diagnostics === "object" ? b.diagnostics : undefined, attachmentName, attachmentMimeType, attachmentSize, attachmentStorageKey,
      });
      await db.insert("supportTicketMessages", { ticketId: ticket.id, authorUserId: optionalClaims?.sub, authorType: "user", body: message, attachmentName, attachmentMimeType, attachmentSize, attachmentStorageKey });

      return json(res, 201, { ticket: { id: ticket.id, status: ticket.status, createdAt: ticket.createdAt, attachmentStored: Boolean(ticket.attachmentStorageKey) } }, requestId);
    }

    if (req.method === "POST" && url.pathname === "/api/v1/help/feedback") {
      const b=await bodyJson(req) as {contentType?:string;contentId?:string;helpful?:boolean;page?:string;metadata?:Record<string,unknown>;website?:string};
      if(String(b.website??"").trim()) return json(res,201,{feedback:{id:randomUUID()}},requestId);
      if(!["faq","guide"].includes(String(b.contentType))||!String(b.contentId??"").trim()||typeof b.helpful!=="boolean") return json(res,400,{error:{code:"HELP_FEEDBACK_INVALID",message:"Valid help feedback is required."}},requestId);
      const optionalClaims=verifyToken(String(req.headers.authorization??""),identityConfig.secret,"access");
      const feedback=await db.insert("helpFeedback",{userId:optionalClaims?.sub,contentType:b.contentType as "faq"|"guide",contentId:String(b.contentId).slice(0,160),helpful:b.helpful,page:String(b.page??"").slice(0,300)||undefined,metadata:b.metadata&&typeof b.metadata==="object"?b.metadata:undefined});
      return json(res,201,{feedback:{id:feedback.id}},requestId);
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

      const claimed=await claimStripeWebhook(db,event);
      if(claimed.duplicate)return json(res,200,{received:true,duplicate:true},requestId);
      try {
      const creditGrant = await grantPurchasedCredits(db,event);
      const gpuCreditGrant = creditGrant ? undefined : await grantPurchasedGPUCredits(db,event);
      const creatorEconomySettlement = creditGrant || gpuCreditGrant ? undefined : await settleCreatorEconomyStripe(db,event);
      const adSettlement = creditGrant || gpuCreditGrant || creatorEconomySettlement ? undefined : await settleAdCampaignStripe(db,event);
      const marketplaceSettlement = creditGrant || gpuCreditGrant || creatorEconomySettlement || adSettlement ? undefined : await settleMarketplaceCheckout(db,event);
      const creditReversal = creditGrant || gpuCreditGrant || marketplaceSettlement ? undefined : await applyStripeCreditReversal(db,event);
      if (!creditGrant && !gpuCreditGrant && !creatorEconomySettlement && !marketplaceSettlement && !creditReversal && process.env.YAPOSAN_ENABLE_LEGACY_SUBSCRIPTIONS === "true") await syncStripeSubscription(
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
      await finishStripeWebhook(db,String(event.id),true);

      return json(
        res,
        200,
        { received: true },
        requestId
      );
      } catch(error){await finishStripeWebhook(db,String(event.id),false,error);return json(res,500,{error:{code:"PAYMENT_WEBHOOK_PROCESSING_FAILED",message:"Payment event could not be processed safely. Stripe may retry."}},requestId)}
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

    if (req.method === "POST" && url.pathname === "/api/v1/internal/product-photo/process-next") {
      const expected = config.productPhotoWorkerToken;
      if (!expected || !constantTimeEqual(String(req.headers["x-worker-token"] ?? ""), expected)) {
        return json(res, 401, { error: { code: "WORKER_UNAUTHORIZED", message: "Valid product photo worker token required" } }, requestId);
      }
      const db = await getDatabase();
      await recoverStaleProductPhotoBatches(db);
      await cleanupExpiredProductPhotoBatches(db, storage);
      const job = await claimNextProductPhotoBatch(db, config.productPhotoWorkerId, config.productPhotoJobLeaseSeconds);
      if (!job) return json(res, 200, { job: null }, requestId);
      const processed = await processProductPhotoBatch(db, storage, job);
      return json(res, 200, { job: processed }, requestId);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/tools/catalog") {
      return json(res, 200, { items: getYaposanToolCatalog() }, requestId);
    }

    const localAssetRawMatch = url.pathname.match(/^\/api\/v1\/assets\/raw\/(.+)$/);
    if (localAssetRawMatch && req.method === "GET" && storage instanceof LocalObjectStorage && process.env.NODE_ENV !== "production") {
      try {
        const key = decodeURIComponent(localAssetRawMatch[1]);
        const bytes = await storage.get(key);
        const asset = (await db.find("socialMediaAssets", row => row.storageKey === key))[0];
        const contentType = asset?.mimeType || "application/octet-stream";
        res.writeHead(200, { "content-type": contentType, "content-length": String(bytes.byteLength), ...securityHeaders(requestId) });
        res.end(Buffer.from(bytes));
        return;
      } catch {
        return json(res, 404, { error: { code: "ASSET_NOT_FOUND", message: "Asset not found." } }, requestId);
      }
    }
    if (localAssetRawMatch && req.method === "PUT") {
      if (!(storage instanceof LocalObjectStorage)) return json(res, 404, { error: { code: "ROUTE_NOT_FOUND", message: "Route not found." } }, requestId);
      try {
        const key = decodeURIComponent(localAssetRawMatch[1]);
        const bytes = await readBody(req);
        const size = Number(req.headers["x-yaposan-size"] ?? -1);
        const expiresAt = String(req.headers["x-yaposan-upload-expires"] ?? "");
        const token = String(req.headers["x-yaposan-upload-token"] ?? "");
        const contentType = String(req.headers["content-type"] ?? "application/octet-stream");
        const stored = await storage.putPlanned(key, bytes, { size, expiresAt, token, contentType });
        return json(res, 201, { stored: { key: stored.key, size: stored.size, checksum: stored.checksum } }, requestId);
      } catch (error) {
        return json(res, 400, { error: { code: "LOCAL_ASSET_UPLOAD_REJECTED", message: error instanceof Error ? error.message : "Upload rejected." } }, requestId);
      }
    }

    const publicShareMatch=url.pathname.match(/^\/api\/v1\/public\/share\/([^/]+)\/resolve$/);
    if(publicShareMatch&&req.method==="POST"){
      if(!publicPageLimiter.check(`${ip}:share:${publicShareMatch[1]}`).allowed)return json(res,429,{error:{code:"SHARE_RATE_LIMITED",message:"Too many share-link requests."}},requestId);
      const b=await bodyJson(req) as {password?:string};
      try{return json(res,200,await resolveShareLink(db,decodeURIComponent(publicShareMatch[1]),String(b.password??"")),requestId)}
      catch(error){const code=error instanceof Error?error.message:"SHARE_LINK_NOT_FOUND";const status=code==="SHARE_PASSWORD_INVALID"?401:code==="SHARE_LINK_EXPIRED"?410:404;return json(res,status,{error:{code,message:code==="SHARE_PASSWORD_INVALID"?"Share-link password is incorrect.":code==="SHARE_LINK_EXPIRED"?"This share link has expired.":"Share link not found."}},requestId)}
    }

    const publicSocialMediaMatch=url.pathname.match(/^\/api\/v1\/public\/social-media\/([^/]+)$/);
    if(publicSocialMediaMatch&&req.method==="GET"){
      const asset=await db.get("socialMediaAssets",publicSocialMediaMatch[1]);
      if(!asset)return json(res,404,{error:{code:"SOCIAL_MEDIA_NOT_FOUND",message:"Media not found."}},requestId);
      const privacy=(await db.find("spacePrivacySettings",x=>x.spaceId===asset.spaceId))[0];
      const publicPostLinks=await db.find("socialPostMedia",x=>x.mediaAssetId===asset.id);
      const publicPosts=await db.find("spacePosts",x=>x.spaceId===asset.spaceId&&x.visibility==="public"&&publicPostLinks.some(link=>link.postId===x.id));
      const publicStories=await db.find("socialStories",x=>x.spaceId===asset.spaceId&&x.mediaAssetId===asset.id&&x.visibility==="public"&&Date.parse(x.expiresAt)>Date.now());
      const presentation=Boolean(privacy?.publicPageEnabled&&(privacy.avatarUri?.includes(asset.id)||privacy.coverUri?.includes(asset.id)));
      if(!presentation&&!publicPosts.length&&!publicStories.length)return json(res,404,{error:{code:"SOCIAL_MEDIA_NOT_PUBLIC",message:"Media not found."}},requestId);
      const bytes=await storage.get(asset.storageKey);res.writeHead(200,{"content-type":asset.mimeType||"application/octet-stream","content-length":String(bytes.byteLength),"cache-control":"public, max-age=300",...securityHeaders(requestId)});res.end(Buffer.from(bytes));return;
    }
    const publicCreatorMatch=url.pathname.match(/^\/api\/v1\/public\/creators\/([^/]+)$/);
    if(publicCreatorMatch && req.method === "GET"){if(!publicPageLimiter.check(`${ip}:${publicCreatorMatch[1]}`).allowed)return json(res,429,{error:{code:"PUBLIC_PAGE_RATE_LIMITED",message:"Too many public page requests."}},requestId);try{return json(res,200,await getPublicCreator(await getDatabase(),decodeURIComponent(publicCreatorMatch[1])),requestId)}catch{return json(res,404,{error:{code:"PUBLIC_PAGE_NOT_FOUND",message:"Public creator page not found."}},requestId)}}
    const publicAdOfferMatch=url.pathname.match(/^\/api\/v1\/public\/creators\/([^/]+)\/advertising$/);
    if(publicAdOfferMatch&&req.method==="GET"){try{return json(res,200,await publicAdOffer(db,decodeURIComponent(publicAdOfferMatch[1])),requestId)}catch{return json(res,404,{error:{code:"AD_OFFER_NOT_FOUND",message:"Advertising is not available for this page."}},requestId)}}
    const publicAdMatch=url.pathname.match(/^\/api\/v1\/public\/creators\/([^/]+)\/ad$/);
    if(publicAdMatch&&req.method==="GET"){if(!publicPageLimiter.check(`${ip}:ad:${publicAdMatch[1]}`).allowed)return json(res,429,{error:{code:"AD_RATE_LIMITED",message:"Too many ad requests."}},requestId);try{const vk=visitorKey(ip,String(req.headers["user-agent"]??""),publicAdMatch[1]);return json(res,200,await selectPublicAd(db,decodeURIComponent(publicAdMatch[1]),vk),requestId)}catch{return json(res,200,{ad:null},requestId)}}
    const publicAdClickMatch=url.pathname.match(/^\/api\/v1\/public\/ads\/([^/]+)\/click$/);
    if(publicAdClickMatch&&req.method==="POST"){if(!publicPageLimiter.check(`${ip}:adclick:${publicAdClickMatch[1]}`).allowed)return json(res,429,{error:{code:"AD_CLICK_RATE_LIMITED",message:"Too many ad click requests."}},requestId);try{const vk=visitorKey(ip,String(req.headers["user-agent"]??""),publicAdClickMatch[1]);return json(res,200,await recordAdClick(db,publicAdClickMatch[1],vk),requestId)}catch(e){return json(res,400,{error:{code:"AD_CLICK_REJECTED",message:e instanceof Error?e.message:"Click rejected."}},requestId)}}

    if(req.method==="POST"&&url.pathname==="/api/v1/auth/verify-email"){if(!authTokenIpLimiter.check(`${ip}:verify-email`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many verification attempts. Try again later."}},requestId);const b=await bodyJson(req) as {token?:string};try{const result=await verifyEmailToken(db,String(b.token??""));return json(res,200,{verified:true,user:result.user?publicUser(result.user):undefined,message:"Email verified. You can now sign in."},requestId)}catch{return json(res,400,{error:{code:"VERIFICATION_TOKEN_INVALID",message:"This verification link is invalid or expired."}},requestId)}}
    if(req.method==="POST"&&url.pathname==="/api/v1/auth/resend-verification"){const b=await bodyJson(req) as {email?:string};const email=String(b.email??"").trim().toLowerCase();if(!authRecoveryIpLimiter.check(`${ip}:resend-verification`).allowed||!authRecoveryAccountLimiter.check(`verify:${authAccountKey(email)}`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many requests. Try again later."}},requestId);const deliveryConfigured=Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM);const user=(await db.find("users",u=>u.email.toLowerCase()===email))[0];if(user&&!user.emailVerified&&deliveryConfigured){try{await sendVerificationEmail(db,user)}catch{}}const localDeliveryUnavailable=process.env.NODE_ENV!=="production"&&!deliveryConfigured;return json(res,202,{accepted:true,deliveryConfigured,message:localDeliveryUnavailable?"Email delivery is not configured in this local environment. Use the development verification command or configure Resend.":"If the account is eligible, a verification email will be sent."},requestId)}
    if(req.method==="POST"&&url.pathname==="/api/v1/auth/forgot-password"){const b=await bodyJson(req) as {email?:string};const email=String(b.email??"").trim().toLowerCase();if(!authRecoveryIpLimiter.check(`${ip}:forgot-password`).allowed||!authRecoveryAccountLimiter.check(`reset:${authAccountKey(email)}`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many requests. Try again later."}},requestId);try{await requestPasswordReset(db,email)}catch{}return json(res,202,{accepted:true,message:"If an account exists for that email, a password reset link will be sent."},requestId)}
    if(req.method==="POST"&&url.pathname==="/api/v1/auth/reset-password"){if(!authTokenIpLimiter.check(`${ip}:reset-password`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many reset attempts. Try again later."}},requestId);const b=await bodyJson(req) as {token?:string;password?:string;confirmPassword?:string};try{return json(res,200,await resetPasswordWithToken(db,String(b.token??""),String(b.password??""),String(b.confirmPassword??"")),requestId)}catch(error){const message=error instanceof Error?error.message:"RESET_FAILED";return json(res,400,{error:{code:"PASSWORD_RESET_FAILED",message:message.startsWith("PASSWORD_POLICY:")?message.slice(16):message==="PASSWORD_CONFIRMATION_MISMATCH"?"New password and confirmation do not match.":"This password reset link is invalid or expired."}},requestId)}}
    if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/auth/forgot-password"){const b=await bodyJson(req) as {email?:string};const email=String(b.email??"").trim().toLowerCase();if(!authRecoveryIpLimiter.check(`${ip}:admin-forgot-password`).allowed||!authRecoveryAccountLimiter.check(`admin-reset:${authAccountKey(email)}`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many requests. Try again later."}},requestId);try{await requestAdminPasswordReset(db,email)}catch{}return json(res,202,{accepted:true,message:"If an active Admin account exists for that email, a reset link will be sent."},requestId)}
    if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/auth/reset-password"){if(!authTokenIpLimiter.check(`${ip}:admin-reset-password`).allowed)return json(res,429,{error:{code:"AUTH_RECOVERY_RATE_LIMITED",message:"Too many reset attempts. Try again later."}},requestId);const b=await bodyJson(req) as {token?:string;password?:string;confirmPassword?:string};try{return json(res,200,await resetAdminPasswordWithToken(db,String(b.token??""),String(b.password??""),String(b.confirmPassword??"")),requestId)}catch(error){const code=error instanceof Error?error.message:"RESET_FAILED";return json(res,400,{error:{code:"ADMIN_PASSWORD_RESET_FAILED",message:code==="PASSWORD_CONFIRMATION_MISMATCH"?"New password and confirmation do not match.":code==="ADMIN_PASSWORD_TOO_SHORT"?"Admin passwords must be at least 14 characters.":"This Admin reset link is invalid or expired."}},requestId)}}

    // Yaposan Admin is a separate identity and authorization domain.
    // Customer bearer tokens, organization roles, Space roles and ADMIN_EMAILS never authorize these routes.
    if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/auth/login"){
      const b=await bodyJson(req) as {email?:string;password?:string};const adminLoginKey=authAccountKey(String(b.email??""));
      if(!adminLoginIpLimiter.check(ip).allowed||!adminLoginAccountLimiter.check(adminLoginKey).allowed){emitSecurityEvent(securityEventPayload({type:"admin.auth.login.rate_limited",severity:"high",requestId,ip,metadata:{accountPresented:Boolean(String(b.email??"").trim())}}));return json(res,429,{error:{code:"ADMIN_LOGIN_RATE_LIMITED",message:"Unable to sign in. Try again later."}},requestId)}
      try{return json(res,200,await authenticateAdmin(db,{email:String(b.email??""),password:String(b.password??"")},{secret:config.adminSessionSecret,bootstrapEmail:config.adminBootstrapEmail,bootstrapPassword:config.adminBootstrapPassword,sessionHours:config.adminSessionHours},{ip,userAgent:String(req.headers["user-agent"]??"")}),requestId)}catch{return json(res,401,{error:{code:"ADMIN_INVALID_CREDENTIALS",message:"Yaposan Admin credentials are invalid."}},requestId)}
    }
    if(url.pathname.startsWith("/api/v1/yaposan-admin/")){
      const adminToken=String(req.headers["x-yaposan-admin-authorization"]??"");
      if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/auth/logout"){try{await revokeAdminSession(db,adminToken,config.adminSessionSecret);return json(res,200,{revoked:true},requestId)}catch{return json(res,401,{error:{code:"ADMIN_UNAUTHORIZED",message:"Yaposan Admin authentication required."}},requestId)}}
      const runAdmin=async(permission:AdminPermission|undefined,work:(principal:Awaited<ReturnType<typeof requireAdmin>>["principal"])=>Promise<unknown>)=>{try{const auth=await requireAdmin(db,adminToken,config.adminSessionSecret,permission);return json(res,200,await work(auth.principal),requestId)}catch(error){const code=error instanceof Error?error.message:"ADMIN_REQUEST_FAILED";const status=code==="ADMIN_FORBIDDEN"?403:code==="ADMIN_UNAUTHORIZED"?401:400;const message=status===403?"Yaposan Admin permission required.":status===401?"Yaposan Admin authentication required.":code;return json(res,status,{error:{code,message}},requestId)}};
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/me") return runAdmin(undefined,async principal=>({admin:publicAdmin(principal)}));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/admins") return runAdmin("security",async()=>({items:await listAdminPrincipals(db)}));
      if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/admins"){const b=await bodyJson(req) as {email?:string;password?:string;role?:import("./database").AdminRole};return runAdmin("security",async principal=>({admin:await createAdminPrincipal(db,principal,{email:String(b.email??""),password:String(b.password??""),role:b.role??"support_admin"})}));}
      const adminPrincipalStatus=url.pathname.match(/^\/api\/v1\/yaposan-admin\/admins\/([^/]+)\/status$/);if(adminPrincipalStatus&&req.method==="PATCH"){const b=await bodyJson(req) as {status?:string};return runAdmin("security",async principal=>({admin:await setAdminPrincipalStatus(db,principal,adminPrincipalStatus[1],b.status==="disabled"?"disabled":"active")}));}
      const adminPrincipalPassword=url.pathname.match(/^\/api\/v1\/yaposan-admin\/admins\/([^/]+)\/reset-password$/);if(adminPrincipalPassword&&req.method==="POST"){const b=await bodyJson(req) as {password?:string;confirmPassword?:string;currentAdminPassword?:string};return runAdmin("security",async principal=>adminResetPrincipalPassword(db,principal,adminPrincipalPassword[1],String(b.password??""),String(b.confirmPassword??""),String(b.currentAdminPassword??"")));}
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/overview") return runAdmin("audit",async()=>adminOverview(db));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/users") return runAdmin("users",async()=>({items:await adminUsers(db,String(url.searchParams.get("q")??""))}));
      const adminUserStatus=url.pathname.match(/^\/api\/v1\/yaposan-admin\/users\/([^/]+)\/status$/);if(adminUserStatus&&req.method==="PATCH"){const b=await bodyJson(req) as {status?:string};return runAdmin("users",async principal=>({user:await setAdminUserStatus(db,principal,adminUserStatus[1],b.status==="disabled"?"disabled":"active",requestId)}));}
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/spaces") return runAdmin("spaces",async()=>({items:await adminSpaces(db)}));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/preview-template") return runAdmin("spaces",async principal=>adminPageTemplatePreview(db,principal,requestId));
      const adminSpacePreviewMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/spaces\/([^/]+)\/preview$/);if(adminSpacePreviewMatch&&req.method==="GET")return runAdmin("spaces",async principal=>adminSpacePreview(db,principal,adminSpacePreviewMatch[1],requestId));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/payment-health") return runAdmin("finance",async()=>adminPaymentHealth(db));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/trust-safety") return runAdmin("security",async()=>phase115SafetyMatrix());
      const adminSpaceStatus=url.pathname.match(/^\/api\/v1\/yaposan-admin\/spaces\/([^/]+)\/status$/);if(adminSpaceStatus&&req.method==="PATCH"){const b=await bodyJson(req) as {status?:string;reason?:string};return runAdmin("spaces",async principal=>({space:await setAdminSpaceStatus(db,principal,adminSpaceStatus[1],b.status==="archived"?"archived":"active",b.reason,requestId)}));}
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/marketplace") return runAdmin("marketplace",async()=>({items:await adminMarketplace(db)}));
      const adminCreatorModeration=url.pathname.match(/^\/api\/v1\/yaposan-admin\/creator-marketplace\/products\/([^/]+)\/moderate$/);
      if(adminCreatorModeration&&req.method==="POST"){const b=await bodyJson(req) as {approved?:boolean};return runAdmin("marketplace",async principal=>({product:await moderateCreatorProductAsAdmin(db,principal.id,adminCreatorModeration[1],Boolean(b.approved))}));}

      const moderationProduct=url.pathname.match(/^\/api\/v1\/yaposan-admin\/marketplace\/products\/([^/]+)\/moderate$/);if(moderationProduct&&req.method==="POST"){const b=await bodyJson(req) as {action?:string;reason?:string};return runAdmin("moderation",async principal=>moderateMarketplaceProduct(db,principal,moderationProduct[1],{action:String(b.action??""),reason:b.reason},requestId));}
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/ai-gpu") return runAdmin("ai_gpu",async()=>adminAIGPU(db));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/finance") return runAdmin("finance",async()=>adminFinance(db));
      if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/finance/costs"){const b=await bodyJson(req);return runAdmin("finance",async principal=>({entry:await recordPlatformCost(db,principal,b,requestId)}));}
      if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/payouts"){const b=await bodyJson(req) as {sellerUserId?:string;amountCents?:number;currency?:string;note?:string};return runAdmin("payouts",async principal=>({payout:await createCreatorPayout(db,principal,{sellerUserId:String(b.sellerUserId??""),amountCents:Number(b.amountCents??0),currency:b.currency,note:b.note},requestId)}));}
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/infrastructure") return runAdmin("infrastructure",async()=>adminInfrastructure(db));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/moderation") return runAdmin("moderation",async()=>({items:await adminModeration(db,Number(url.searchParams.get("limit")??200))}));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/audit") return runAdmin("audit",async()=>({items:await adminAudit(db,Number(url.searchParams.get("limit")??200))}));
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/security") return runAdmin("security",async()=>adminSecurity(db,validateProductionConfig(config)));
      // admin operations belong inside the separate Yaposan Admin authorization domain.
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/production-readiness") return runAdmin("security",async()=>productionReadiness116(db));
      if(req.method==="POST"&&url.pathname==="/api/v1/yaposan-admin/payments/reconcile") return runAdmin("finance",async principal=>{const b=await bodyJson(req);return reconcileCreatorPayment(db,principal,b as any,requestId)});
      const payoutSafetyMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/creators\/([^/]+)\/payout-safety$/);if(req.method==="GET"&&payoutSafetyMatch)return runAdmin("finance",async()=>creatorPayoutSafety(db,payoutSafetyMatch[1],String(url.searchParams.get("currency")??"USD").toUpperCase()));
      const adFraudMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/ads\/([^/]+)\/fraud-review$/);if(req.method==="GET"&&adFraudMatch)return runAdmin("moderation",async()=>adFraudReview(db,adFraudMatch[1]));if(req.method==="POST"&&adFraudMatch)return runAdmin("moderation",async principal=>enforceAdFraudHold(db,principal,adFraudMatch[1],requestId));
      const appealResolveMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/moderation\/appeals\/([^/]+)\/resolve$/);if(req.method==="POST"&&appealResolveMatch)return runAdmin("moderation",async principal=>{const b=await bodyJson(req);return resolveModerationAppeal(db,principal,appealResolveMatch[1],String(b.decision??"") as any,String(b.note??""),requestId)});
      if(req.method==="GET"&&url.pathname==="/api/v1/yaposan-admin/support/tickets") return runAdmin("users",async()=>{const status=url.searchParams.get("status");const q=(url.searchParams.get("q")??"").toLowerCase();const items=(await db.find("supportTickets",t=>(!status||t.status===status)&&(!q||`${t.id} ${t.email} ${t.name} ${t.subject} ${t.category}`.toLowerCase().includes(q)))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return {items:items.slice(0,250).map(t=>({...t,attachmentStorageKey:undefined}))};});
      const adminSupportMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/support\/tickets\/([^/]+)$/);
      if(adminSupportMatch&&req.method==="GET") return runAdmin("users",async()=>{const ticket=await db.get("supportTickets",adminSupportMatch[1]);if(!ticket)throw new Error("SUPPORT_TICKET_NOT_FOUND");const messages=(await db.find("supportTicketMessages",m=>m.ticketId===ticket.id)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));return {ticket:{...ticket,attachmentStorageKey:undefined},messages:messages.map(m=>({...m,attachmentStorageKey:undefined}))};});
      if(adminSupportMatch&&req.method==="PATCH"){const b=await bodyJson(req) as {status?:string};return runAdmin("users",async principal=>{const status=String(b.status??"");if(!supportTicketStatuses.has(status))throw new Error("SUPPORT_STATUS_INVALID");const ticket=await db.update("supportTickets",adminSupportMatch[1],{status:status as any});await db.insert("supportTicketMessages",{ticketId:ticket.id,authorType:"system",body:`Status changed to ${status.replaceAll("_"," ")} by Yaposan Admin ${principal.email}.`});return {ticket:{...ticket,attachmentStorageKey:undefined}};});}
      const adminNoteMatch=url.pathname.match(/^\/api\/v1\/yaposan-admin\/support\/tickets\/([^/]+)\/messages$/);
      if(adminNoteMatch&&req.method==="POST"){const b=await bodyJson(req) as {message?:string};return runAdmin("users",async principal=>{const ticket=await db.get("supportTickets",adminNoteMatch[1]);if(!ticket)throw new Error("SUPPORT_TICKET_NOT_FOUND");const body=String(b.message??"").trim().slice(0,10000);if(body.length<2)throw new Error("SUPPORT_REPLY_REQUIRED");const message=await db.insert("supportTicketMessages",{ticketId:ticket.id,authorType:"staff",body});await db.update("supportTickets",ticket.id,{status:"waiting_for_user"});await db.insert("adminAuditEvents",{principalId:principal.id,action:"support.ticket.reply",target:ticket.id,requestId,metadata:{messageId:message.id}});return {message};});}
      return json(res,404,{error:{code:"ADMIN_ROUTE_NOT_FOUND",message:"Yaposan Admin route not found."}},requestId);
    }

    if (url.pathname.startsWith("/api/v1/admin/") || url.pathname.startsWith("/api/v1/enterprise-operations/")) {
      return json(res, 404, { error: { code: "ROUTE_NOT_FOUND", message: "Route not found." } }, requestId);
    }

    let claims = verifyToken(String(req.headers.authorization ?? ""),identityConfig.secret,"access");
    if(!claims&&config.identityProvider==="oidc"){
      const external=await verifyOidcBearer(String(req.headers.authorization??""),{issuer:config.oidcIssuer,clientId:config.oidcClientId,audience:config.oidcAudience});
      if(external&&external.email&&external.email_verified===true){
        try{const account=await provisionFederatedAccount(db,{email:external.email,subject:external.sub,issuer:external.iss});const amr=Array.isArray(external.amr)&&external.amr.some(x=>/webauthn|passkey|fido/i.test(x))?"passkey":Array.isArray(external.amr)&&external.amr.some(x=>/mfa|otp|totp/i.test(x))?"mfa":"oidc";const key=createHash("sha256").update(`${external.iss}|${external.sid??external.sub}`).digest("hex");const mirror=await getOrCreateExternalSession(db,account.user.id,{externalSessionKey:key,ip,userAgent:String(req.headers["user-agent"]??""),assurance:amr,expiresAt:new Date(external.exp*1000).toISOString()});claims={sub:account.user.id,sid:mirror.id,type:"access",exp:external.exp*1000,ver:mirror.version,amr};}catch(error){emitSecurityEvent(securityEventPayload({type:"auth.oidc.binding_failed",severity:"high",requestId,ip,metadata:{reason:error instanceof Error?error.message:"unknown"}}));}
      }
    }
    if(!claims)return json(res,401,{error:{code:"UNAUTHORIZED",message:"Authentication required"}},requestId);
    try{await requireActiveUserSession(db,claims)}catch{return json(res,401,{error:{code:"SESSION_REVOKED",message:"This session is no longer active. Sign in again."}},requestId)}
    const userId = claims.sub;

    if(req.method==="POST"&&url.pathname==="/api/v1/auth/logout"){await revokeUserSession(db,userId,claims.sid);return json(res,200,{revoked:true},requestId)}
    if(req.method==="GET"&&url.pathname==="/api/v1/security/sessions"){return json(res,200,{items:await listUserSessions(db,userId,claims.sid)},requestId)}
    const revokeSessionMatch=url.pathname.match(/^\/api\/v1\/security\/sessions\/([^/]+)\/revoke$/);if(revokeSessionMatch&&req.method==="POST"){try{return json(res,200,{session:await revokeUserSession(db,userId,revokeSessionMatch[1])},requestId)}catch{return json(res,404,{error:{code:"SESSION_NOT_FOUND",message:"Session not found."}},requestId)}}
    if(req.method==="POST"&&url.pathname==="/api/v1/security/sessions/revoke-others"){return json(res,200,{revoked:await revokeOtherSessions(db,userId,claims.sid)},requestId)}
    if(req.method==="POST"&&url.pathname==="/api/v1/security/change-password"){const b=await bodyJson(req) as {currentPassword?:string;newPassword?:string;confirmPassword?:string};try{return json(res,200,await changePassword(db,userId,String(b.currentPassword??""),String(b.newPassword??""),String(b.confirmPassword??"")),requestId)}catch(error){const code=error instanceof Error?error.message:"PASSWORD_CHANGE_FAILED";const message=code.startsWith("PASSWORD_POLICY:")?code.slice(16):code==="CURRENT_PASSWORD_INVALID"?"Current password is incorrect.":code==="PASSWORD_CONFIRMATION_MISMATCH"?"New password and confirmation do not match.":code==="PASSWORD_REUSE_NOT_ALLOWED"?"Choose a new password you are not currently using.":"Password could not be changed.";return json(res,400,{error:{code:"PASSWORD_CHANGE_FAILED",message}},requestId)}}

    const authenticatedAssetRawMatch = url.pathname.match(/^\/api\/v1\/assets\/raw\/(.+)$/);
    if (authenticatedAssetRawMatch && req.method === "GET") {
      const key = decodeURIComponent(authenticatedAssetRawMatch[1]);
      const asset = (await db.find("assets", row => row.storageKey === key && row.ownerUserId === userId))[0];
      const socialAsset = asset ? undefined : (await db.find("socialMediaAssets", row => row.storageKey === key))[0];
      if (!asset && !socialAsset) return json(res, 404, { error: { code: "ASSET_NOT_FOUND", message: "Asset not found." } }, requestId);
      if (socialAsset && socialAsset.ownerUserId !== userId) { try { await requireSpaceAccess(db,userId,socialAsset.spaceId,"viewer"); } catch { return json(res,404,{error:{code:"ASSET_NOT_FOUND",message:"Asset not found."}},requestId); } }
      const bytes = await storage.get(key);
      res.writeHead(200, { "content-type": asset?.mimeType || socialAsset?.mimeType || "application/octet-stream", "content-length": String(bytes.byteLength), ...securityHeaders(requestId) });
      res.end(Buffer.from(bytes));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/spaces") {
      return json(res, 200, { items: await listUserSpaces(db, userId) }, requestId);
    }

    if (req.method === "POST" && url.pathname === "/api/v1/spaces") {
      const b = await bodyJson(req) as { organizationId?: string; name?: string; slug?: string; kind?: "personal"|"team"|"business"; visibility?: "private"|"team" };
      const requestedKind = b.kind ?? "personal";
      if (requestedKind === "personal") {
        const existingPersonal = (await listUserSpaces(db, userId)).find(space => space.kind === "personal" && space.ownerUserId === userId);
        if (existingPersonal) return json(res, 200, { space: existingPersonal, existing: true }, requestId);
      }
      const memberships = await db.find("memberships", row => row.userId === userId);
      const organizationId = String(b.organizationId ?? memberships[0]?.organizationId ?? "");
      if (!organizationId) return json(res, 400, { error: { code: "SPACE_ORGANIZATION_REQUIRED", message: "An organization is required to create an AI page." } }, requestId);
      try {
        const space = await createSpace(db, { userId, organizationId, name: String(b.name ?? "My AI Page"), slug: b.slug, kind: requestedKind, visibility: b.visibility });
        return json(res, 201, { space, existing: false }, requestId);
      } catch (error) {
        return json(res, 400, { error: { code: "SPACE_CREATE_FAILED", message: error instanceof Error ? error.message : "Could not create AI page." } }, requestId);
      }
    }

    const spaceMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)$/);
    if (spaceMatch && req.method === "GET") {
      try { return json(res, 200, { space: await requireSpaceAccess(db, userId, spaceMatch[1]) }, requestId); }
      catch { return json(res, 404, { error: { code: "SPACE_NOT_FOUND", message: "AI page not found." } }, requestId); }
    }
    if (spaceMatch && req.method === "PATCH") {
      const b = await bodyJson(req) as { name?: string; visibility?: "private"|"team"; status?: "active"|"archived" };
      try { return json(res, 200, { space: await updateSpace(db, userId, spaceMatch[1], b) }, requestId); }
      catch { return json(res, 403, { error: { code: "SPACE_UPDATE_DENIED", message: "You do not have permission to update this AI page." } }, requestId); }
    }

    const spaceSecurityMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/security$/);
    if(spaceSecurityMatch&&req.method==="GET"){try{return json(res,200,{settings:await getSpaceSecurity(db,userId,spaceSecurityMatch[1])},requestId)}catch{return json(res,403,{error:{code:"SPACE_SECURITY_DENIED",message:"Space security settings access denied."}},requestId)}}
    if(spaceSecurityMatch&&req.method==="PATCH"){const b=await bodyJson(req);try{await requireSpaceSensitiveAction(db,spaceSecurityMatch[1],claims,"team_admin");return json(res,200,{settings:await updateSpaceSecurity(db,userId,spaceSecurityMatch[1],b)},requestId)}catch(e){return json(res,403,{error:{code:"SPACE_SECURITY_UPDATE_DENIED",message:e instanceof Error?e.message:"Space security update denied."}},requestId)}}

    const privacyMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/privacy$/);
    if(privacyMatch && req.method === "GET"){try{return json(res,200,await getSpacePrivacy(db,userId,privacyMatch[1]),requestId)}catch{return json(res,403,{error:{code:"SPACE_PRIVACY_DENIED",message:"Privacy settings access denied."}},requestId)}}
    if(privacyMatch && req.method === "PATCH"){const b=await bodyJson(req);try{return json(res,200,{settings:await updateSpacePrivacy(db,userId,privacyMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_PRIVACY_UPDATE_FAILED",message:e instanceof Error?e.message:"Could not update privacy settings."}},requestId)}}
    const privacyResourceMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/privacy\/resources\/(post|ai|studio|product|project)\/([^/]+)$/);
    if(privacyResourceMatch && req.method === "PATCH"){const b=await bodyJson(req) as {visibility?:string;audienceUserIds?:string[]};try{if(["public","unlisted","paid"].includes(String(b.visibility)))await requireSpaceSensitiveAction(db,privacyResourceMatch[1],claims,"public_share");return json(res,200,{item:await setResourceVisibility(db,userId,privacyResourceMatch[1],privacyResourceMatch[2] as PrivacyResourceType,privacyResourceMatch[3],String(b.visibility??"private"),b.audienceUserIds)},requestId)}catch(e){const code=e instanceof Error?e.message:"RESOURCE_PRIVACY_UPDATE_FAILED";return json(res,code==="STEP_UP_REQUIRED"?403:400,{error:{code,message:code==="STEP_UP_REQUIRED"?"Passkey or MFA verification is required before public sharing.":code}},requestId)}}
    const privacyGrantMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/privacy\/connections\/([^/]+)\/grant$/);
    if(privacyGrantMatch && req.method === "PATCH"){const b=await bodyJson(req);try{return json(res,200,{grant:await updateConnectionDataGrant(db,userId,privacyGrantMatch[1],privacyGrantMatch[2],b)},requestId)}catch(e){return json(res,400,{error:{code:"CONNECTION_DATA_GRANT_FAILED",message:e instanceof Error?e.message:"Could not update connection data grant."}},requestId)}}

    const resourcesMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/resources$/);
    if(resourcesMatch && req.method === "GET"){try{return json(res,200,await getSpaceResources(db,userId,resourcesMatch[1]),requestId)}catch{return json(res,403,{error:{code:"SPACE_RESOURCES_DENIED",message:"AI Page access denied."}},requestId)}}
    const aiResourceMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/ai$/); if(aiResourceMatch&&req.method==="POST"){const b=await bodyJson(req);try{return json(res,201,{item:await createSpaceAI(db,userId,aiResourceMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_AI_FAILED",message:e instanceof Error?e.message:"Could not create AI."}},requestId)}}
    const connectionResourceMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/connections$/); if(connectionResourceMatch&&req.method==="POST"){const b=await bodyJson(req);try{await requireSpaceSensitiveAction(db,connectionResourceMatch[1],claims,"external_connection");return json(res,201,{item:await createSpaceConnection(db,userId,connectionResourceMatch[1],b)},requestId)}catch(e){return json(res,403,{error:{code:"SPACE_CONNECTION_FAILED",message:e instanceof Error?e.message:"Could not add connection."}},requestId)}}
    const computeResourceMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/compute$/); if(computeResourceMatch&&req.method==="POST"){const b=await bodyJson(req);try{return json(res,201,{item:await createSpaceCompute(db,userId,computeResourceMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_COMPUTE_FAILED",message:e instanceof Error?e.message:"Could not add compute."}},requestId)}}

    const publishSpaceMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/publish$/);
    if(publishSpaceMatch && req.method === "POST"){try{await requireSpaceSensitiveAction(db,publishSpaceMatch[1],claims,"public_share");return json(res,200,await publishSpace(db,userId,publishSpaceMatch[1]),requestId)}catch(e){return json(res,403,{error:{code:"SPACE_PUBLISH_DENIED",message:e instanceof Error&&e.message==="STEP_UP_REQUIRED"?"Passkey or MFA verification is required before publishing this AI Page.":"Only a Space admin can publish this AI Page."}},requestId)}}

    const studiosMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios$/);
    if(studiosMatch && req.method === "GET"){try{return json(res,200,{items:await listStudios(db,userId,studiosMatch[1])},requestId)}catch{return json(res,403,{error:{code:"SPACE_STUDIOS_DENIED",message:"Studio access denied."}},requestId)}}
    if(studiosMatch && req.method === "POST"){const b=await bodyJson(req);try{return json(res,201,{studio:await createStudio(db,userId,studiosMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"STUDIO_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create Studio."}},requestId)}}
    const studioMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)$/);
    if(studioMatch && req.method === "GET"){try{return json(res,200,{studio:await getStudio(db,userId,studioMatch[1],studioMatch[2])},requestId)}catch{return json(res,404,{error:{code:"STUDIO_NOT_FOUND",message:"Studio not found."}},requestId)}}
    if(studioMatch && req.method === "PATCH"){const b=await bodyJson(req);try{return json(res,200,{studio:await updateStudio(db,userId,studioMatch[1],studioMatch[2],b)},requestId)}catch(e){return json(res,400,{error:{code:"STUDIO_UPDATE_FAILED",message:e instanceof Error?e.message:"Could not update Studio."}},requestId)}}
    const studioPlanMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)\/plan$/);
    if(studioPlanMatch && req.method === "GET"){try{return json(res,200,{plan:await planStudioRun(db,userId,studioPlanMatch[1],studioPlanMatch[2])},requestId)}catch(e){return json(res,400,{error:{code:"STUDIO_PLAN_FAILED",message:e instanceof Error?e.message:"Could not plan Studio run."}},requestId)}}
    const studioRunMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)\/run$/);
    if(studioRunMatch && req.method === "POST"){const b=await bodyJson(req) as {input?:unknown;approvedNodeIds?:string[];executionKey?:string};try{return json(res,201,{run:await runStudio(db,userId,studioRunMatch[1],studioRunMatch[2],b.input??{},{approvedNodeIds:b.approvedNodeIds,executionKey:b.executionKey})},requestId)}catch(e){const m=e instanceof Error?e.message:"Studio run failed.";return json(res,m.startsWith("STUDIO_APPROVAL_REQUIRED")?409:m==="STUDIO_RUN_RATE_LIMITED"?429:400,{error:{code:m.startsWith("STUDIO_APPROVAL_REQUIRED")?"STUDIO_APPROVAL_REQUIRED":m==="STUDIO_RUN_RATE_LIMITED"?"STUDIO_RUN_RATE_LIMITED":"STUDIO_RUN_FAILED",message:m}},requestId)}}
    const studioRunsMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)\/runs$/);
    if(studioRunsMatch && req.method === "GET"){try{return json(res,200,{items:await listStudioRuns(db,userId,studioRunsMatch[1],studioRunsMatch[2])},requestId)}catch{return json(res,403,{error:{code:"STUDIO_RUNS_DENIED",message:"Studio run access denied."}},requestId)}}
    const studioRunDetailMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)\/runs\/([^/]+)$/);
    if(studioRunDetailMatch && req.method === "GET"){try{return json(res,200,{run:await getStudioRun(db,userId,studioRunDetailMatch[1],studioRunDetailMatch[2],studioRunDetailMatch[3])},requestId)}catch{return json(res,404,{error:{code:"STUDIO_RUN_NOT_FOUND",message:"Studio run not found."}},requestId)}}
    const studioRunRetryMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/studios\/([^/]+)\/runs\/([^/]+)\/retry$/);
    if(studioRunRetryMatch && req.method === "POST"){const b=await bodyJson(req) as {approvedNodeIds?:string[]};try{return json(res,201,{run:await retryStudioRun(db,userId,studioRunRetryMatch[1],studioRunRetryMatch[2],studioRunRetryMatch[3],b.approvedNodeIds??[])},requestId)}catch(e){return json(res,400,{error:{code:"STUDIO_RUN_RETRY_FAILED",message:e instanceof Error?e.message:"Could not retry Studio run."}},requestId)}}

    if(url.pathname==="/api/v1/space-invites"&&req.method==="GET") return json(res,200,{items:await listMySpaceInvites(db,userId)},requestId);
    const acceptInviteMatch=url.pathname.match(/^\/api\/v1\/space-invites\/([^/]+)\/accept$/);
    if(acceptInviteMatch&&req.method==="POST"){try{return json(res,200,{membership:await acceptSpaceInvite(db,userId,acceptInviteMatch[1])},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_INVITE_ACCEPT_FAILED",message:e instanceof Error?e.message:"Could not accept invite."}},requestId)}}

    const teamMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/team$/);
    if(teamMatch&&req.method==="GET"){try{return json(res,200,await getSpaceTeam(db,userId,teamMatch[1]),requestId)}catch{return json(res,403,{error:{code:"SPACE_TEAM_DENIED",message:"Team access denied."}},requestId)}}
    const teamInviteMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/team\/invites$/);
    if(teamInviteMatch&&req.method==="POST"){const b=await bodyJson(req) as {email?:string;role?:string};try{return json(res,201,await inviteSpaceMember(db,userId,teamInviteMatch[1],String(b.email||""),String(b.role||"viewer")),requestId)}catch(e){return json(res,400,{error:{code:"SPACE_INVITE_FAILED",message:e instanceof Error?e.message:"Could not invite member."}},requestId)}}
    const teamInviteDeleteMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/team\/invites\/([^/]+)$/);
    if(teamInviteDeleteMatch&&req.method==="DELETE"){try{return json(res,200,{invite:await revokeSpaceInvite(db,userId,teamInviteDeleteMatch[1],teamInviteDeleteMatch[2])},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_INVITE_REVOKE_FAILED",message:e instanceof Error?e.message:"Could not revoke invite."}},requestId)}}
    const teamMemberMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/team\/members\/([^/]+)$/);
    if(teamMemberMatch&&req.method==="PATCH"){const b=await bodyJson(req) as {role?:string};try{return json(res,200,{member:await updateSpaceMemberRole(db,userId,teamMemberMatch[1],teamMemberMatch[2],String(b.role||"viewer"))},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_MEMBER_UPDATE_FAILED",message:e instanceof Error?e.message:"Could not update member."}},requestId)}}
    if(teamMemberMatch&&req.method==="DELETE"){try{return json(res,200,await removeSpaceMember(db,userId,teamMemberMatch[1],teamMemberMatch[2]),requestId)}catch(e){return json(res,400,{error:{code:"SPACE_MEMBER_REMOVE_FAILED",message:e instanceof Error?e.message:"Could not remove member."}},requestId)}}

    const storeMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/store$/);
    if(storeMatch&&req.method==="GET"){try{return json(res,200,await getSpaceStore(db,userId,storeMatch[1]),requestId)}catch{return json(res,403,{error:{code:"SPACE_STORE_DENIED",message:"Store access denied."}},requestId)}}
    const storeProductsMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/store\/products$/);
    if(storeProductsMatch&&req.method==="POST"){const b=await bodyJson(req);try{return json(res,201,{product:await createStoreProduct(db,userId,storeProductsMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"STORE_PRODUCT_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create product."}},requestId)}}
    const storeProductMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/store\/products\/([^/]+)$/);
    if(storeProductMatch&&req.method==="PATCH"){const b=await bodyJson(req);try{return json(res,200,{product:await updateStoreProduct(db,userId,storeProductMatch[1],storeProductMatch[2],b)},requestId)}catch(e){return json(res,400,{error:{code:"STORE_PRODUCT_UPDATE_FAILED",message:e instanceof Error?e.message:"Could not update product."}},requestId)}}
    const storeOrderMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/store\/products\/([^/]+)\/orders$/);
    if(storeOrderMatch&&req.method==="POST"){try{return json(res,201,{order:await createStoreOrder(db,userId,storeOrderMatch[1],storeOrderMatch[2])},requestId)}catch(e){return json(res,400,{error:{code:"STORE_ORDER_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create order."}},requestId)}}

    const publicProfileMatch=url.pathname.match(/^\/api\/v1\/social\/profiles\/([^/]+)$/);
    if(publicProfileMatch&&req.method==="GET"){try{return json(res,200,await getPublicProfile(db,userId,publicProfileMatch[1]),requestId)}catch(e){return json(res,403,{error:{code:"SOCIAL_PROFILE_DENIED",message:e instanceof Error?e.message:"Profile unavailable."}},requestId)}}
    const publicFollowMatch=url.pathname.match(/^\/api\/v1\/social\/profiles\/([^/]+)\/follow$/);
    if(publicFollowMatch&&req.method==="POST"){try{return json(res,200,await togglePublicFollow(db,userId,publicFollowMatch[1]),requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_FOLLOW_FAILED",message:e instanceof Error?e.message:"Could not follow."}},requestId)}}
    if(url.pathname==="/api/v1/social/feed"&&req.method==="GET"){const mode=(url.searchParams.get("mode")||"explore") as "explore"|"following"|"saved";try{return json(res,200,{posts:await getExploreFeed(db,userId,mode)},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_FEED_FAILED",message:e instanceof Error?e.message:"Could not load feed."}},requestId)}}
    if(url.pathname==="/api/v1/social/search"&&req.method==="GET"){return json(res,200,await searchSocial(db,userId,url.searchParams.get("q")||""),requestId)}
    const globalTagMatch=url.pathname.match(/^\/api\/v1\/social\/hashtags\/([^/]+)$/);
    if(globalTagMatch&&req.method==="GET"){return json(res,200,{posts:await getHashtagFeed(db,userId,decodeURIComponent(globalTagMatch[1]))},requestId)}
    if(url.pathname==="/api/v1/social/communities"&&req.method==="GET"){return json(res,200,{communities:await listCommunities(db,userId)},requestId)}
    const communityCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/communities$/);
    if(communityCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,{community:await createCommunity(db,userId,communityCreateMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"COMMUNITY_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create community."}},requestId)}}
    const communityJoinMatch=url.pathname.match(/^\/api\/v1\/social\/communities\/([^/]+)\/join$/);
    if(communityJoinMatch&&req.method==="POST"){try{return json(res,200,{membership:await joinCommunity(db,userId,communityJoinMatch[1])},requestId)}catch(e){return json(res,400,{error:{code:"COMMUNITY_JOIN_FAILED",message:e instanceof Error?e.message:"Could not join community."}},requestId)}}
    const communityPostsMatch=url.pathname.match(/^\/api\/v1\/social\/communities\/([^/]+)\/posts$/);
    if(communityPostsMatch&&req.method==="POST"){const b=await bodyJson(req) as {body?:string};try{return json(res,201,{post:await createCommunityPost(db,userId,communityPostsMatch[1],String(b.body??""))},requestId)}catch(e){return json(res,400,{error:{code:"COMMUNITY_POST_FAILED",message:e instanceof Error?e.message:"Could not post to community."}},requestId)}}
    const communityModerateMatch=url.pathname.match(/^\/api\/v1\/social\/communities\/([^/]+)\/moderation$/);
    if(communityModerateMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,{action:await moderateCommunity(db,userId,communityModerateMatch[1],b)},requestId)}catch(e){return json(res,403,{error:{code:"COMMUNITY_MODERATION_DENIED",message:e instanceof Error?e.message:"Moderation denied."}},requestId)}}
    if(url.pathname==="/api/v1/social/pages"&&req.method==="GET"){return json(res,200,{pages:await listSocialPages(db)},requestId)}
    const pageCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/pages$/);
    if(pageCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,{page:await createSocialPage(db,userId,pageCreateMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_PAGE_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create page."}},requestId)}}
    if(url.pathname==="/api/v1/social/events"&&req.method==="GET"){return json(res,200,{events:await listUpcomingEvents(db,userId)},requestId)}
    const eventCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/events$/);
    if(eventCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,{event:await createSocialEvent(db,userId,eventCreateMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_EVENT_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create event."}},requestId)}}
    const eventRsvpMatch=url.pathname.match(/^\/api\/v1\/social\/events\/([^/]+)\/rsvp$/);
    if(eventRsvpMatch&&req.method==="POST"){const b=await bodyJson(req) as {response?:string};try{return json(res,200,{rsvp:await rsvpEvent(db,userId,eventRsvpMatch[1],String(b.response??"interested"))},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_EVENT_RSVP_FAILED",message:e instanceof Error?e.message:"Could not RSVP."}},requestId)}}
    if(url.pathname==="/api/v1/social/live"&&req.method==="GET"){return json(res,200,{sessions:await listLiveSessions(db)},requestId)}
    const liveCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/live$/);
    if(liveCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,await createLiveSession(db,userId,liveCreateMatch[1],b),requestId)}catch(e){return json(res,400,{error:{code:"LIVE_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create live session."}},requestId)}}
    const liveStartMatch=url.pathname.match(/^\/api\/v1\/social\/live\/([^/]+)\/start$/);
    if(liveStartMatch&&req.method==="POST"){try{return json(res,200,{session:await startLiveSession(db,userId,liveStartMatch[1])},requestId)}catch(e){return json(res,403,{error:{code:"LIVE_START_DENIED",message:e instanceof Error?e.message:"Could not start live."}},requestId)}}
    const liveEndMatch=url.pathname.match(/^\/api\/v1\/social\/live\/([^/]+)\/end$/);
    if(liveEndMatch&&req.method==="POST"){try{return json(res,200,{session:await endLiveSession(db,userId,liveEndMatch[1])},requestId)}catch(e){return json(res,403,{error:{code:"LIVE_END_DENIED",message:e instanceof Error?e.message:"Could not end live."}},requestId)}}
    const liveChatMatch=url.pathname.match(/^\/api\/v1\/social\/live\/([^/]+)\/chat$/);
    if(liveChatMatch&&req.method==="POST"){const b=await bodyJson(req) as {body?:string};try{return json(res,201,{message:await sendLiveChat(db,userId,liveChatMatch[1],String(b.body??""))},requestId)}catch(e){return json(res,400,{error:{code:"LIVE_CHAT_FAILED",message:e instanceof Error?e.message:"Could not send live chat."}},requestId)}}
    const liveReactionMatch=url.pathname.match(/^\/api\/v1\/social\/live\/([^/]+)\/reactions$/);
    if(liveReactionMatch&&req.method==="POST"){const b=await bodyJson(req) as {kind?:string};try{return json(res,201,{reaction:await reactLive(db,userId,liveReactionMatch[1],String(b.kind??"like"))},requestId)}catch(e){return json(res,400,{error:{code:"LIVE_REACTION_FAILED",message:e instanceof Error?e.message:"Could not react."}},requestId)}}

    if(url.pathname==="/api/v1/social/ai/profiles"&&req.method==="GET"){return json(res,200,{profiles:await listAiSocialProfiles(db)},requestId)}
    const aiProfileCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/ai\/profiles$/);
    if(aiProfileCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as {agentId?:string;displayName?:string;handle?:string;bio?:string};try{return json(res,201,{profile:await createAiSocialProfile(db,userId,aiProfileCreateMatch[1],{agentId:String(b.agentId??""),displayName:b.displayName,handle:b.handle,bio:b.bio})},requestId)}catch(e){return json(res,400,{error:{code:"AI_SOCIAL_PROFILE_FAILED",message:e instanceof Error?e.message:"Could not create AI profile."}},requestId)}}
    if(url.pathname==="/api/v1/social/ai/assist"&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,200,await socialAiAssist(db,userId,b),requestId)}catch(e){return json(res,400,{error:{code:"AI_SOCIAL_ASSIST_FAILED",message:e instanceof Error?e.message:"AI social assistance failed."}},requestId)}}
    if(url.pathname==="/api/v1/social/ai/search"&&req.method==="GET"){return json(res,200,await aiSocialSearch(db,userId,String(url.searchParams.get("q")??"")),requestId)}
    if(url.pathname==="/api/v1/social/ai/recommendations"&&req.method==="GET"){return json(res,200,{items:await aiSocialRecommendations(db,userId)},requestId)}
    const aiDisclosureMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts\/([^/]+)\/ai-disclosure$/);
    if(aiDisclosureMatch&&req.method==="POST"){const b=await bodyJson(req) as {agentId?:string;disclosure?:string};try{return json(res,200,{post:await labelAiGeneratedPost(db,userId,aiDisclosureMatch[1],aiDisclosureMatch[2],b)},requestId)}catch(e){return json(res,400,{error:{code:"AI_DISCLOSURE_FAILED",message:e instanceof Error?e.message:"Could not label AI content."}},requestId)}}
    const aiModerationMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/ai\/moderation$/);
    if(aiModerationMatch&&req.method==="POST"){const b=await bodyJson(req) as {resourceType?:string;resourceId?:string;text?:string};try{return json(res,201,{suggestion:await createAiModerationSuggestion(db,userId,aiModerationMatch[1],{resourceType:b.resourceType,resourceId:String(b.resourceId??""),text:b.text})},requestId)}catch(e){return json(res,400,{error:{code:"AI_MODERATION_SUGGESTION_FAILED",message:e instanceof Error?e.message:"Could not create moderation suggestion."}},requestId)}}

    const socialMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social$/);
    if (socialMatch && req.method === "GET") { try { return json(res,200,await getSpaceSocial(db,userId,socialMatch[1]),requestId); } catch { return json(res,403,{error:{code:"SPACE_SOCIAL_DENIED",message:"AI Page access denied."}},requestId); } }
    const audienceCandidatesMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/audience-candidates$/);
    if(audienceCandidatesMatch&&req.method==="GET"){try{const page=await requireSpaceAccess(db,userId,audienceCandidatesMatch[1],"admin");const [users,follows,members]=await Promise.all([db.find('users',u=>u.status==='active'&&u.id!==userId),db.find('spaceFollows',f=>f.spaceId===page.id),db.find('spaceMemberships',m=>m.spaceId===page.id)]);const ids=new Set([...follows.map(f=>f.followerUserId),...members.map(m=>m.userId)]);const items=users.filter(u=>ids.has(u.id)).slice(0,200).map(u=>({id:u.id,email:u.email,following:follows.some(f=>f.followerUserId===u.id),member:members.some(m=>m.userId===u.id)}));return json(res,200,{items},requestId)}catch(e){return json(res,403,{error:{code:'AUDIENCE_CANDIDATES_DENIED',message:e instanceof Error?e.message:'Could not load audience.'}},requestId)}}
    const postsMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts$/);
    if (postsMatch && req.method === "POST") { const b=await bodyJson(req) as {body?:string;visibility?:string;audienceUserIds?:string[];mediaUrl?:string;mediaType?:string;quotePostId?:string;mediaAssetIds?:string[]}; try{const post=await createSpacePost(db,userId,postsMatch[1],String(b.body??""),b.visibility,b.mediaUrl,b.mediaType,b.quotePostId,b.audienceUserIds);const media=Array.isArray(b.mediaAssetIds)&&b.mediaAssetIds.length?await attachPostMedia(db,userId,postsMatch[1],post.id,b.mediaAssetIds):[];return json(res,201,{post:{...post,media}},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_POST_FAILED",message:e instanceof Error?e.message:"Could not post."}},requestId)} }
    const commentsMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts\/([^/]+)\/comments$/);
    if (commentsMatch && req.method === "POST") { const b=await bodyJson(req) as {body?:string;parentCommentId?:string}; try{return json(res,201,{comment:await createSpaceComment(db,userId,commentsMatch[1],commentsMatch[2],String(b.body??""),b.parentCommentId?String(b.parentCommentId):undefined)},requestId)}catch(e){return json(res,400,{error:{code:"SPACE_COMMENT_FAILED",message:e instanceof Error?e.message:"Could not comment."}},requestId)} }
    const commentReactionMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/comments\/([^/]+)\/reaction$/);
    if(commentReactionMatch&&req.method==="POST"){const b=await bodyJson(req) as {kind?:string};try{return json(res,200,await toggleSpaceCommentReaction(db,userId,commentReactionMatch[1],commentReactionMatch[2],String(b.kind??"like")),requestId)}catch(e){return json(res,400,{error:{code:"COMMENT_REACTION_FAILED",message:e instanceof Error?e.message:"Could not react to comment."}},requestId)}}
    const followMatch = url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/follow$/);
    if (followMatch && req.method === "POST") { try{return json(res,200,await toggleSpaceFollow(db,userId,followMatch[1]),requestId)}catch{return json(res,403,{error:{code:"SPACE_FOLLOW_DENIED",message:"Could not update follow state."}},requestId)} }
    const reactionMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts\/([^/]+)\/reaction$/);
    if(reactionMatch&&req.method==="POST"){const b=await bodyJson(req) as {kind?:string};try{return json(res,200,await togglePostReaction(db,userId,reactionMatch[1],reactionMatch[2],String(b.kind??"like")),requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_REACTION_FAILED",message:e instanceof Error?e.message:"Could not react."}},requestId)}}
    const bookmarkMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts\/([^/]+)\/bookmark$/);
    if(bookmarkMatch&&req.method==="POST"){try{return json(res,200,await togglePostBookmark(db,userId,bookmarkMatch[1],bookmarkMatch[2]),requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_BOOKMARK_FAILED",message:e instanceof Error?e.message:"Could not bookmark."}},requestId)}}
    const repostMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/posts\/([^/]+)\/repost$/);
    if(repostMatch&&req.method==="POST"){try{return json(res,200,await togglePostRepost(db,userId,repostMatch[1],repostMatch[2]),requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_REPOST_FAILED",message:e instanceof Error?e.message:"Could not repost."}},requestId)}}
    const hashtagMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/hashtags\/trending$/);
    if(hashtagMatch&&req.method==="GET"){try{return json(res,200,{hashtags:await getTrendingHashtags(db,userId,hashtagMatch[1])},requestId)}catch{return json(res,403,{error:{code:"SOCIAL_HASHTAGS_DENIED",message:"Could not load hashtags."}},requestId)}}
    const notificationsMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/notifications$/);
    if(notificationsMatch&&req.method==="GET"){try{return json(res,200,{notifications:await listSocialNotifications(db,userId,notificationsMatch[1])},requestId)}catch{return json(res,403,{error:{code:"SOCIAL_NOTIFICATIONS_DENIED",message:"Could not load notifications."}},requestId)}}
    const notificationReadMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/notifications\/([^/]+)\/read$/);
    if(notificationReadMatch&&req.method==="POST"){try{return json(res,200,{notification:await markNotificationRead(db,userId,notificationReadMatch[1],notificationReadMatch[2])},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_NOTIFICATION_FAILED",message:e instanceof Error?e.message:"Could not update notification."}},requestId)}}
    if(url.pathname==="/api/v1/social/dm/inbox"&&req.method==="GET"){try{return json(res,200,{items:await listGlobalDmInbox(db,userId)},requestId)}catch(e){return json(res,400,{error:{code:"DM_INBOX_FAILED",message:e instanceof Error?e.message:"Could not load DMs."}},requestId)}}
    const dmReadMatch=url.pathname.match(/^\/api\/v1\/social\/dm\/conversations\/([^/]+)\/read$/);
    if(dmReadMatch&&req.method==="POST"){try{return json(res,200,{member:await markConversationRead(db,userId,dmReadMatch[1])},requestId)}catch(e){return json(res,403,{error:{code:"DM_READ_FAILED",message:e instanceof Error?e.message:"Could not mark DM read."}},requestId)}}
    const pageSummaryMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/summary$/);
    if(pageSummaryMatch&&req.method==="GET"){try{const page=await requireSpaceAccess(db,userId,pageSummaryMatch[1],"viewer");const [ai,studios,projects,posts,products,privacyRows]=await Promise.all([db.find("spaceAIAgents",x=>x.spaceId===page.id&&x.enabled),db.find("spaceStudios",x=>x.spaceId===page.id),db.find("projects",x=>x.spaceId===page.id&&!x.deletedAt),db.find("spacePosts",x=>x.spaceId===page.id),db.find("spaceStoreProducts",x=>x.spaceId===page.id&&x.status==="active"),db.find("spacePrivacySettings",x=>x.spaceId===page.id)]);const publishable=new Set(["public","unlisted","paid"]);const published=ai.filter(x=>publishable.has(x.visibility)).length+studios.filter(x=>x.status==="published"&&publishable.has(x.visibility)).length+posts.filter(x=>x.visibility==="public"||x.visibility==="unlisted").length+products.filter(x=>x.visibility==="public").length+projects.filter(x=>publishable.has(String((x.payload as any)?.publication?.visibility))).length+(privacyRows[0]?.publicPageEnabled?1:0);return json(res,200,{summary:{aiModels:ai.length,studios:studios.length,creations:projects.length,published}},requestId)}catch(e){return json(res,403,{error:{code:"PAGE_SUMMARY_DENIED",message:e instanceof Error?e.message:"Could not load Page summary."}},requestId)}}
    const dmOwnerMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/dm-owner$/);
    if(dmOwnerMatch&&req.method==="POST"){try{return json(res,201,{conversation:await createOwnerConversation(db,userId,dmOwnerMatch[1])},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_DM_FAILED",message:e instanceof Error?e.message:"Could not start DM."}},requestId)}}
    const conversationsMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/conversations$/);
    if(conversationsMatch&&req.method==="GET"){try{return json(res,200,{conversations:await listConversations(db,userId,conversationsMatch[1])},requestId)}catch{return json(res,403,{error:{code:"SOCIAL_CONVERSATIONS_DENIED",message:"Could not load conversations."}},requestId)}}
    if(conversationsMatch&&req.method==="POST"){const b=await bodyJson(req) as {participantUserIds?:string[]};try{return json(res,201,{conversation:await createConversation(db,userId,conversationsMatch[1],Array.isArray(b.participantUserIds)?b.participantUserIds:[])},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_CONVERSATION_FAILED",message:e instanceof Error?e.message:"Could not create conversation."}},requestId)}}
    const messagesMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/conversations\/([^/]+)\/messages$/);
    if(messagesMatch&&req.method==="GET"){try{return json(res,200,{messages:await listMessages(db,userId,messagesMatch[1],messagesMatch[2])},requestId)}catch(e){return json(res,403,{error:{code:"SOCIAL_MESSAGES_DENIED",message:e instanceof Error?e.message:"Could not load messages."}},requestId)}}
    if(messagesMatch&&req.method==="POST"){const b=await bodyJson(req) as {body?:string};try{return json(res,201,{message:await sendMessage(db,userId,messagesMatch[1],messagesMatch[2],String(b.body??""))},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_MESSAGE_FAILED",message:e instanceof Error?e.message:"Could not send message."}},requestId)}}
    const blockMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/blocks\/([^/]+)$/);
    if(blockMatch&&req.method==="POST"){try{return json(res,200,await toggleUserBlock(db,userId,blockMatch[1],blockMatch[2]),requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_BLOCK_FAILED",message:e instanceof Error?e.message:"Could not update block."}},requestId)}}
    const reportMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/reports$/);
    if(reportMatch&&req.method==="POST"){const b=await bodyJson(req) as {resourceType?:string;resourceId?:string;reason?:string};try{return json(res,201,{report:await reportSocialContent(db,userId,reportMatch[1],String(b.resourceType??"post"),String(b.resourceId??""),String(b.reason??""))},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_REPORT_FAILED",message:e instanceof Error?e.message:"Could not report."}},requestId)}}

    const socialMediaUploadMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/social\/media\/uploads$/);
    if(socialMediaUploadMatch&&req.method==="POST"){try{const mimeType=String(req.headers["content-type"]??"").toLowerCase();const name=String(req.headers["x-file-name"]??"social-media");const bytes=await readBody(req);const asset=await uploadSocialMedia(db,storage,userId,socialMediaUploadMatch[1],{name,mimeType,bytes,caption:String(req.headers["x-media-caption"]??""),altText:String(req.headers["x-media-alt"]??"")});return json(res,201,{asset},requestId)}catch(e){return json(res,400,{error:{code:"SOCIAL_MEDIA_UPLOAD_FAILED",message:e instanceof Error?e.message:"Could not upload media."}},requestId)}}
    if(url.pathname==="/api/v1/creator-economy/dashboard"&&req.method==="GET"){return json(res,200,await creatorEconomyDashboard(db,userId),requestId)}
    if(url.pathname==="/api/v1/creator-economy/membership-plans"&&req.method==="GET"){return json(res,200,{items:await listMembershipPlans(db,String(url.searchParams.get("spaceId")??""))},requestId)}
    if(url.pathname==="/api/v1/creator-economy/membership-plans"&&req.method==="POST"){const b=await bodyJson(req) as any;try{return json(res,201,{plan:await createMembershipPlan(db,userId,b)},requestId)}catch(e){return json(res,400,{error:{code:"CREATOR_PLAN_FAILED",message:e instanceof Error?e.message:"Could not create plan."}},requestId)}}
    if(url.pathname==="/api/v1/creator-economy/subscribe"&&req.method==="POST"){const b=await bodyJson(req) as any;try{try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}const sub=await beginMembershipSubscription(db,userId,String(b.planId??""));const plan=await db.get("creatorMembershipPlans",sub.planId);if(!plan)return json(res,404,{error:{code:"PLAN_NOT_FOUND",message:"Membership plan not found."}},requestId);const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}const session=await createCreatorMembershipCheckoutSession({amountCents:plan.monthlyCents,currency:plan.currency,name:plan.name,successUrl,cancelUrl,sourceId:sub.id,subscriberUserId:userId});await db.update("creatorMembershipSubscriptions",sub.id,{providerCheckoutSessionId:String(session.id)});return json(res,200,{subscription:await db.get("creatorMembershipSubscriptions",sub.id),checkout:{id:session.id,url:session.url}},requestId)}catch(e){return json(res,400,{error:{code:"CREATOR_SUBSCRIBE_FAILED",message:e instanceof Error?e.message:"Could not subscribe."}},requestId)}}
    if(url.pathname==="/api/v1/creator-economy/tips/checkout"&&req.method==="POST"){const b=await bodyJson(req) as any;try{try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}const tip=await createTip(db,userId,b);const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}const session=await createCreatorOneTimeCheckoutSession({amountCents:tip.amountCents,currency:tip.currency,name:"Creator tip",successUrl,cancelUrl,purpose:"creator_tip",sourceId:tip.id,buyerUserId:userId});await db.update("creatorTips",tip.id,{providerCheckoutSessionId:String(session.id)});return json(res,200,{tip:await db.get("creatorTips",tip.id),checkout:{id:session.id,url:session.url}},requestId)}catch(e){return json(res,400,{error:{code:"CREATOR_TIP_FAILED",message:e instanceof Error?e.message:"Could not create tip."}},requestId)}}
    const paidCommunityMatch=url.pathname.match(/^\/api\/v1\/creator-economy\/communities\/([^/]+)\/membership-plan$/);if(paidCommunityMatch&&req.method==="PUT"){const b=await bodyJson(req) as any;try{return json(res,200,{community:await linkPaidCommunity(db,userId,paidCommunityMatch[1],String(b.planId??""))},requestId)}catch(e){return json(res,400,{error:{code:"PAID_COMMUNITY_FAILED",message:e instanceof Error?e.message:"Could not configure paid community."}},requestId)}}
    const paidPostMatch=url.pathname.match(/^\/api\/v1\/creator-economy\/posts\/([^/]+)\/paid$/);if(paidPostMatch&&req.method==="PUT"){const b=await bodyJson(req) as any;try{return json(res,200,{post:await setPaidPost(db,userId,String(b.spaceId??""),paidPostMatch[1],Number(b.priceCents??0))},requestId)}catch(e){return json(res,400,{error:{code:"PAID_POST_FAILED",message:e instanceof Error?e.message:"Could not set paid post."}},requestId)}}
    const unlockPostMatch=url.pathname.match(/^\/api\/v1\/creator-economy\/posts\/([^/]+)\/unlock$/);if(unlockPostMatch&&req.method==="POST"){const b=await bodyJson(req) as any;try{try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}const access=await beginPaidPostUnlock(db,userId,unlockPostMatch[1]);const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}const session=await createCreatorOneTimeCheckoutSession({amountCents:access.priceCents,currency:access.currency,name:"Paid creator post",successUrl,cancelUrl,purpose:"paid_post",sourceId:access.id,buyerUserId:userId});await db.update("paidContentAccess",access.id,{providerCheckoutSessionId:String(session.id)});return json(res,200,{access:await db.get("paidContentAccess",access.id),checkout:{id:session.id,url:session.url}},requestId)}catch(e){return json(res,400,{error:{code:"PAID_POST_UNLOCK_FAILED",message:e instanceof Error?e.message:"Could not unlock post."}},requestId)}}
    const adSettingsMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/ads\/settings$/);
    if(adSettingsMatch&&req.method==="PUT"){const b=await bodyJson(req) as any;try{return json(res,200,{settings:await updateAdSettings(db,userId,adSettingsMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"AD_SETTINGS_FAILED",message:e instanceof Error?e.message:"Could not update ad settings."}},requestId)}}
    const adDashboardMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/ads\/dashboard$/);
    if(adDashboardMatch&&req.method==="GET"){try{return json(res,200,await creatorAdDashboard(db,userId,adDashboardMatch[1]),requestId)}catch(e){return json(res,403,{error:{code:"AD_DASHBOARD_DENIED",message:e instanceof Error?e.message:"Access denied."}},requestId)}}
    const adDecisionMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/ads\/campaigns\/([^/]+)\/(approve|reject|pause)$/);
    if(adDecisionMatch&&req.method==="POST"){try{return json(res,200,{campaign:await decideAdCampaign(db,userId,adDecisionMatch[1],adDecisionMatch[2],adDecisionMatch[3] as any)},requestId)}catch(e){return json(res,400,{error:{code:"AD_DECISION_FAILED",message:e instanceof Error?e.message:"Could not update campaign."}},requestId)}}
    if(url.pathname==="/api/v1/creator-ads/campaigns/checkout"&&req.method==="POST"){const b=await bodyJson(req) as any;try{try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}const campaign=await createAdCampaign(db,userId,b);const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}const session=await createCreatorAdCheckoutSession({amountCents:campaign.budgetCents,successUrl,cancelUrl,campaignId:campaign.id,advertiserUserId:userId});await db.update("creatorAdCampaigns",campaign.id,{providerCheckoutSessionId:String(session.id)});return json(res,200,{campaign:await db.get("creatorAdCampaigns",campaign.id),checkout:{id:session.id,url:session.url}},requestId)}catch(e){return json(res,400,{error:{code:"AD_CAMPAIGN_FAILED",message:e instanceof Error?e.message:"Could not create ad campaign."}},requestId)}}
    if(url.pathname==="/api/v1/social/stories"&&req.method==="GET"){return json(res,200,{stories:await getActiveStories(db,userId)},requestId)}
    const storyCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/stories$/);
    if(storyCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as {mediaAssetId?:string;body?:string;visibility?:string;highlightId?:string};try{return json(res,201,{story:await createStory(db,userId,storyCreateMatch[1],b)},requestId)}catch(e){return json(res,400,{error:{code:"STORY_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create story."}},requestId)}}
    const storyViewMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/stories\/([^/]+)\/view$/);
    if(storyViewMatch&&req.method==="POST"){try{return json(res,200,{view:await viewStory(db,userId,storyViewMatch[1],storyViewMatch[2])},requestId)}catch(e){return json(res,400,{error:{code:"STORY_VIEW_FAILED",message:e instanceof Error?e.message:"Could not view story."}},requestId)}}
    const highlightMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/highlights$/);
    if(highlightMatch&&req.method==="POST"){const b=await bodyJson(req) as {name?:string;coverMediaAssetId?:string};try{return json(res,201,{highlight:await createHighlight(db,userId,highlightMatch[1],String(b.name??""),b.coverMediaAssetId)},requestId)}catch(e){return json(res,400,{error:{code:"HIGHLIGHT_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create highlight."}},requestId)}}
    if(url.pathname==="/api/v1/social/reels"&&req.method==="GET"){return json(res,200,{reels:await getReelsFeed(db,userId)},requestId)}
    const reelCreateMatch=url.pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/reels$/);
    if(reelCreateMatch&&req.method==="POST"){const b=await bodyJson(req) as {mediaAssetId?:string;caption?:string;audioTitle?:string;durationMs?:number;visibility?:string};try{return json(res,201,{reel:await createReel(db,userId,reelCreateMatch[1],{mediaAssetId:String(b.mediaAssetId??""),caption:b.caption,audioTitle:b.audioTitle,durationMs:b.durationMs,visibility:b.visibility})},requestId)}catch(e){return json(res,400,{error:{code:"REEL_CREATE_FAILED",message:e instanceof Error?e.message:"Could not create reel."}},requestId)}}

    if (req.method === "POST" && url.pathname === "/api/v1/support/uploads") {
      const mimeType=String(req.headers["content-type"] ?? "application/octet-stream").toLowerCase();
      const name=String(req.headers["x-file-name"] ?? "support-attachment").slice(0,160);
      if(!SUPPORT_ATTACHMENT_MIME_TYPES.has(mimeType)) return json(res,400,{error:{code:"SUPPORT_ATTACHMENT_TYPE",message:"Unsupported support attachment type."}},requestId);
      const bytes=await readBody(req);
      if(!bytes.length||bytes.length>SUPPORT_ATTACHMENT_MAX_BYTES) return json(res,400,{error:{code:"SUPPORT_ATTACHMENT_SIZE",message:"Support attachments must be 10 MB or smaller."}},requestId);
      if(!supportAttachmentMatchesMime(bytes,mimeType)) return json(res,400,{error:{code:"SUPPORT_ATTACHMENT_SIGNATURE",message:"Attachment contents do not match the declared file type."}},requestId);
      const stored=await storage.put({workspaceId:`support-${userId}`,name,contentType:mimeType,body:bytes});
      return json(res,201,{attachment:{storageKey:stored.key,name,mimeType,size:stored.size}},requestId);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/support/tickets/my") {
      const items=(await db.find("supportTickets",t=>t.userId===userId)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      return json(res,200,{items:items.map(t=>({id:t.id,subject:t.subject,category:t.category,priority:t.priority,status:t.status,createdAt:t.createdAt,updatedAt:t.updatedAt}))},requestId);
    }

    const supportAttachmentMatch=url.pathname.match(/^\/api\/v1\/support\/tickets\/([^/]+)\/attachment$/);
    if(req.method==="GET"&&supportAttachmentMatch){
      const ticket=await db.get("supportTickets",supportAttachmentMatch[1]);
      if(!ticket||ticket.userId!==userId||!ticket.attachmentStorageKey) return json(res,404,{error:{code:"SUPPORT_ATTACHMENT_NOT_FOUND",message:"Attachment not found."}},requestId);
      const bytes=await storage.get(ticket.attachmentStorageKey);
      res.writeHead(200,{"content-type":ticket.attachmentMimeType??"application/octet-stream","content-disposition":`attachment; filename="${String(ticket.attachmentName??"support-attachment").replace(/[\r\n"]/g,"")}"`,...securityHeaders(requestId)});res.end(Buffer.from(bytes));return;
    }

    const supportTicketMatch=url.pathname.match(/^\/api\/v1\/support\/tickets\/([^/]+)$/);
    if (req.method === "GET" && supportTicketMatch) {
      const ticket=await db.get("supportTickets",supportTicketMatch[1]);
      if(!ticket||ticket.userId!==userId) return json(res,404,{error:{code:"SUPPORT_TICKET_NOT_FOUND",message:"Support ticket not found."}},requestId);
      const messages=(await db.find("supportTicketMessages",m=>m.ticketId===ticket.id)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
      return json(res,200,{ticket:{...ticket,attachmentStorageKey:undefined},messages:messages.map(m=>({...m,attachmentStorageKey:undefined}))},requestId);
    }

    const supportReplyMatch=url.pathname.match(/^\/api\/v1\/support\/tickets\/([^/]+)\/reply$/);
    if (req.method === "POST" && supportReplyMatch) {
      const ticket=await db.get("supportTickets",supportReplyMatch[1]);
      if(!ticket||ticket.userId!==userId) return json(res,404,{error:{code:"SUPPORT_TICKET_NOT_FOUND",message:"Support ticket not found."}},requestId);
      const b=await bodyJson(req) as {message?:string}; const body=String(b.message??"").trim().slice(0,10000);
      if(body.length<2) return json(res,400,{error:{code:"SUPPORT_REPLY_REQUIRED",message:"Reply cannot be empty."}},requestId);
      const message=await db.insert("supportTicketMessages",{ticketId:ticket.id,authorUserId:userId,authorType:"user",body});
      await db.update("supportTickets",ticket.id,{status:"open"});
      return json(res,201,{message},requestId);
    }


    // staff support moved to the dedicated /api/v1/yaposan-admin/* security domain.

    if (req.method === "POST" && url.pathname === "/api/v1/image/product-photo-analyze") {
      const body = await bodyJson(req) as { imageBase64?: string; mimeType?: string; categoryHint?: "auto" | "hard-goods" | "footwear" | "apparel" | "furniture" | "thin-structures" | "hair-fur" | "glass-transparent" | "jewelry" | "general-merchandise" };
      const result = await runSelfHostedProductPhotoAnalysis({ imageBase64: String(body.imageBase64 ?? ""), mimeType: String(body.mimeType ?? ""), categoryHint: body.categoryHint }, loadBackgroundRemovalConfig());
      return json(res, 200, result, requestId);
    }

    if (req.method === "POST" && url.pathname === "/api/v1/image/background-remove") {
      const body = await bodyJson(req) as {
        imageBase64?: string; mimeType?: string; background?: "transparent" | "white" | "custom";
        backgroundColor?: string; qualityMode?: "auto" | "fast" | "quality";
        preset?: "marketplace-product" | "pure-white-catalog" | "transparent-original" | "custom"; paddingPercent?: number; squareCanvas?: boolean; preserveShadow?: boolean;
        categoryHint?: "auto" | "hard-goods" | "footwear" | "apparel" | "furniture" | "thin-structures" | "hair-fur" | "glass-transparent" | "jewelry" | "general-merchandise";
        outputFormat?: "png" | "webp" | "jpeg"; normalizeLighting?: boolean; catalogTargetOccupancy?: number; catalogCanvasPx?: number; targetLuma?: number; targetRgb?: number[]; strictWhite?: boolean; whiteAuditThreshold?: number;
      };
      const result = await runSelfHostedBackgroundRemoval({
        imageBase64: String(body.imageBase64 ?? ""),
        mimeType: String(body.mimeType ?? ""),
        background: body.background,
        backgroundColor: body.backgroundColor,
        qualityMode: body.qualityMode,
        preset: body.preset,
        paddingPercent: body.paddingPercent,
        squareCanvas: body.squareCanvas,
        preserveShadow: body.preserveShadow,
        categoryHint: body.categoryHint,
        outputFormat: body.outputFormat,
        normalizeLighting: body.normalizeLighting,
        catalogTargetOccupancy: body.catalogTargetOccupancy,
        catalogCanvasPx: body.catalogCanvasPx,
        targetLuma: body.targetLuma,
        targetRgb: body.targetRgb,
        strictWhite: body.strictWhite,
        whiteAuditThreshold: body.whiteAuditThreshold,
      }, loadBackgroundRemovalConfig());
      return json(res, 200, result, requestId);
    }


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

    const batchCreatePath = url.pathname === "/api/v1/product-photo/batches";
    if (req.method === "POST" && batchCreatePath) {
      const b = await bodyJson(req) as { idempotencyKey?:string; strictWhite?:boolean; outputFormat?:"png"|"webp"|"jpeg"; items?:{name:string;mimeType:string;size:number;checksum?:string}[] };
      const job = await createProductPhotoBatch(db, { userId, organizationId: organizationForUser?.id, idempotencyKey:b.idempotencyKey, strictWhite:b.strictWhite, outputFormat:b.outputFormat, items:Array.isArray(b.items)?b.items:[] });
      return json(res, 201, { batch: await getProductPhotoBatch(db, job.id, userId, organizationForUser?.id) }, requestId);
    }
    if (req.method === "GET" && batchCreatePath) {
      return json(res, 200, { batches: await listProductPhotoBatches(db, userId, organizationForUser?.id) }, requestId);
    }
    const batchItemUpload = match(url.pathname, /^\/api\/v1\/product-photo\/batches\/([^/]+)\/items\/([^/]+)\/upload$/);
    if (req.method === "POST" && batchItemUpload) {
      const b = await bodyJson(req) as { imageBase64?:string; mimeType?:string };
      const bytes = Buffer.from(String(b.imageBase64 ?? ""), "base64");
      const job = await uploadProductPhotoBatchItem(db, storage, { jobId:batchItemUpload[1], itemId:batchItemUpload[2], userId, bytes, mimeType:String(b.mimeType??"") });
      return json(res, 200, { batch: await getProductPhotoBatch(db, job.id, userId, organizationForUser?.id) }, requestId);
    }
    const batchStart = match(url.pathname, /^\/api\/v1\/product-photo\/batches\/([^/]+)\/start$/);
    if (req.method === "POST" && batchStart) {
      const job = await startProductPhotoBatch(db, batchStart[1], userId);
      return json(res, 200, { batch: await getProductPhotoBatch(db, job.id, userId, organizationForUser?.id) }, requestId);
    }
    const batchRetry = match(url.pathname, /^\/api\/v1\/product-photo\/batches\/([^/]+)\/retry$/);
    if (req.method === "POST" && batchRetry) {
      const job = await retryProductPhotoBatch(db, batchRetry[1], userId);
      return json(res, 200, { batch: await getProductPhotoBatch(db, job.id, userId, organizationForUser?.id) }, requestId);
    }
    const batchZip = match(url.pathname, /^\/api\/v1\/product-photo\/batches\/([^/]+)\/zip$/);
    if (req.method === "GET" && batchZip) {
      const bytes = await getProductPhotoBatchZip(db, storage, batchZip[1], userId, organizationForUser?.id);
      res.writeHead(200, { "content-type":"application/zip", "content-disposition":`attachment; filename="yaposan-product-photo-${batchZip[1]}.zip"`, ...securityHeaders(requestId) });
      res.end(Buffer.from(bytes));
      return;
    }
    const batchGet = match(url.pathname, /^\/api\/v1\/product-photo\/batches\/([^/]+)$/);
    if (req.method === "GET" && batchGet) {
      return json(res, 200, { batch: await getProductPhotoBatch(db, batchGet[1], userId, organizationForUser?.id) }, requestId);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/product-photo/batch-metrics") {
      return json(res, 200, await productPhotoBatchMetrics(db), requestId);
    }

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

    if (req.method === "GET" && url.pathname === "/api/v1/team/summary") {
      return json(res, 200, await organizationSummary(db, userId), requestId);
    }

    // legacy platform-admin and enterprise-operations customer-token routes were removed.
    // Platform-wide administration is available only through /api/v1/yaposan-admin/* with a dedicated Admin session.

    // customer commerce domain. These routes expose customer charges, balances,
    // entitlements, and creator proceeds only. Company operating expenses are never projected.
    if (req.method === "GET" && url.pathname === "/api/v1/marketplace") {
      return json(res,200,await listMarketplace(db,userId,String(url.searchParams.get("q")??""),url.searchParams.get("kind")??undefined),requestId);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/marketplace/library") {
      return json(res,200,await myMarketplaceLibrary(db,userId),requestId);
    }
    const marketplaceInstall=url.pathname.match(/^\/api\/v1\/marketplace\/products\/([^/]+)\/install$/);
    if (marketplaceInstall && req.method === "POST") {
      try{return json(res,201,{entitlement:await installMarketplaceProduct(db,userId,marketplaceInstall[1])},requestId)}catch(error){return json(res,400,{error:{code:"MARKETPLACE_INSTALL_FAILED",message:error instanceof Error?error.message:"Install failed"}},requestId)}
    }
    const marketplaceCheckout=url.pathname.match(/^\/api\/v1\/marketplace\/products\/([^/]+)\/checkout$/);
    if (marketplaceCheckout && req.method === "POST") {
      const b=await bodyJson(req); try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)} const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");
      for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid marketplace return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Marketplace return URL is not allowed."}},requestId)}
      try{const created=await createMarketplaceOrder(db,userId,marketplaceCheckout[1]);if(('free' in created&&created.free)||('alreadyOwned' in created&&created.alreadyOwned))return json(res,200,created,requestId);if(!created.order)return json(res,409,{error:{code:"MARKETPLACE_ORDER_REQUIRED",message:"Marketplace order could not be created."}},requestId);const product=await db.get("spaceStoreProducts",created.order.productId);if(!product)return json(res,404,{error:{code:"MARKETPLACE_PRODUCT_NOT_FOUND",message:"Marketplace product not found."}},requestId);const membership=(await db.find("memberships",m=>m.userId===userId))[0];const sub=membership?(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0]:undefined;const session=await createMarketplaceCheckoutSession({customerId:sub?.providerCustomerId,amountCents:created.order.grossCents,currency:created.order.currency,productName:product.name,successUrl,cancelUrl,orderId:created.order.id,buyerUserId:userId});await attachMarketplaceCheckout(db,created.order.id,String(session.id));return json(res,200,{order:await db.get("spaceStoreOrders",created.order.id),checkout:{id:session.id,url:session.url}},requestId)}catch(error){return json(res,400,{error:{code:"MARKETPLACE_CHECKOUT_FAILED",message:error instanceof Error?error.message:"Checkout failed"}},requestId)}
    }
    if (req.method === "GET" && url.pathname === "/api/v1/my-usage") {
      try{return json(res,200,await myUsageAndBilling(db,userId),requestId)}catch(error){return json(res,400,{error:{code:"USAGE_BILLING_UNAVAILABLE",message:error instanceof Error?error.message:"Usage unavailable"}},requestId)}
    }
    if (req.method === "GET" && url.pathname === "/api/v1/subscription/plans") {
      return json(res,200,{items:Object.values(PLAN_CATALOG).map(plan=>({id:plan.id,name:plan.name,monthlyCents:plan.monthlyCents,features:plan.features,limits:{storageBytes:plan.storageBytes,aiCredits:plan.aiCredits,seats:plan.seats}}))},requestId);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/subscription/status") {
      try{const usage=await myUsageAndBilling(db,userId);return json(res,200,usage.subscription,requestId)}catch(error){return json(res,400,{error:{code:"SUBSCRIPTION_STATUS_UNAVAILABLE",message:error instanceof Error?error.message:"Subscription unavailable"}},requestId)}
    }
    if (req.method === "GET" && url.pathname === "/api/v1/gpu-credits/packs") {
      return json(res,200,{items:Object.values(GPU_CREDIT_PACKS).map(({stripePriceEnv,...pack})=>pack)},requestId);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/gpu-credits/balance") {
      const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);return json(res,200,{balance:await gpuCreditBalance(db,membership.organizationId)},requestId);
    }
    if (req.method === "POST" && url.pathname === "/api/v1/gpu-credits/checkout") {
      const b=await bodyJson(req);try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}const pack=GPU_CREDIT_PACKS[String(b.pack??"") as keyof typeof GPU_CREDIT_PACKS];if(!pack)return json(res,400,{error:{code:"INVALID_GPU_CREDIT_PACK",message:"Choose a valid GPU credit pack."}},requestId);const successUrl=String(b.successUrl??""),cancelUrl=String(b.cancelUrl??"");for(const candidate of [successUrl,cancelUrl]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}const membership=(await db.find("memberships",m=>m.userId===userId))[0];if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);const priceId=process.env[pack.stripePriceEnv];if(!priceId)return json(res,503,{error:{code:"GPU_CREDITS_NOT_CONFIGURED",message:"GPU credit checkout is not configured on this deployment."}},requestId);const sub=(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0];const session=await createGPUCreditCheckoutSession({customerId:sub?.providerCustomerId,priceId,successUrl,cancelUrl,organizationId:membership.organizationId,pack:pack.id});return json(res,200,{id:session.id,url:session.url},requestId);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/creator/earnings") {
      return json(res,200,await creatorEarningsDashboard(db,userId),requestId);
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

    // creator marketplace moderation is Yaposan-Admin-only.

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
              isAdmin: false,
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

      const uploadSecurity=classifyUploadRisk({name:String(b.name??""),contentType:String(b.contentType??"application/octet-stream"),size:Number(b.size??0)},Boolean(config.malwareScannerUrl));
      return json(res,201,{upload:plan,security:uploadSecurity},requestId);
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

      const workspaceId = String(b.workspaceId ?? "");
      const storageKey = String(b.key ?? "");
      if (!storageKey || !storageKey.startsWith(`${storageKeyPrefix(workspaceId)}/`)) {
        return json(res, 400, { error: { code: "ASSET_STORAGE_KEY_INVALID", message: "Uploaded object does not belong to this workspace." } }, requestId);
      }
      let storedObject: { size: number; checksum?: string; contentType?: string };
      try { storedObject = await storage.stat(storageKey); }
      catch { return json(res, 400, { error: { code: "ASSET_UPLOAD_NOT_FOUND", message: "The uploaded object could not be verified." } }, requestId); }
      const declaredSize = Math.max(0, Number(b.size) || 0);
      if (storedObject.size !== declaredSize) {
        return json(res, 400, { error: { code: "ASSET_SIZE_MISMATCH", message: "Uploaded object size does not match the upload metadata." } }, requestId);
      }
      if (b.checksum && storedObject.checksum && String(b.checksum).toLowerCase() !== storedObject.checksum.toLowerCase()) {
        return json(res, 400, { error: { code: "ASSET_CHECKSUM_MISMATCH", message: "Uploaded object checksum does not match." } }, requestId);
      }

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

      const incomingSize = storedObject.size;

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
            storageKey,
            checksum: storedObject.checksum ?? b.checksum,
            securityStatus: classifyUploadRisk({name:String(b.name??""),contentType:String(b.contentType??"application/octet-stream"),size:incomingSize},Boolean(config.malwareScannerUrl)).requiresMalwareScan ? "pending" : "clean",
            securityReason: classifyUploadRisk({name:String(b.name??""),contentType:String(b.contentType??"application/octet-stream"),size:incomingSize},Boolean(config.malwareScannerUrl)).requiresMalwareScan ? "Quarantined pending malware scan" : undefined,
          }
        );

      return json(
        res,
        201,
        { asset },
        requestId
      );
    }

    if (url.pathname.startsWith("/api/v1/billing/") && process.env.YAPOSAN_ENABLE_LEGACY_SUBSCRIPTIONS !== "true") {
      return json(res,410,{error:{code:"LEGACY_SUBSCRIPTIONS_DISABLED",message:"Yaposan subscriptions are disabled. Yaposan is free; use AI credits or your own AI provider."}},requestId);
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

    if (req.method === "GET" && url.pathname === "/api/v1/ai/media/capabilities") {
      return json(res, 200, {
        ...mediaProviderCapabilities(),
        backgroundRemoval: {
          configured: Boolean(process.env.BACKGROUND_REMOVAL_URL),
          endpoint: process.env.BACKGROUND_REMOVAL_URL ? "configured" : "missing",
        },
      }, requestId);
    }

    const mediaJobMatch = url.pathname.match(/^\/api\/v1\/ai\/media\/(image|video|audio)\/jobs\/([^/]+)$/);
    if (mediaJobMatch && req.method === "GET") {
      try { return json(res, 200, await getMediaJob(mediaJobMatch[1] as "image"|"video"|"audio", decodeURIComponent(mediaJobMatch[2])), requestId); }
      catch (error) { return json(res, 502, { error:{ code:"AI_MEDIA_STATUS_FAILED", message:error instanceof Error?error.message:String(error) } }, requestId); }
    }
    if (mediaJobMatch && req.method === "DELETE") {
      try { return json(res, 200, await cancelMediaJob(mediaJobMatch[1] as "image"|"video"|"audio", decodeURIComponent(mediaJobMatch[2])), requestId); }
      catch (error) { return json(res, 502, { error:{ code:"AI_MEDIA_CANCEL_FAILED", message:error instanceof Error?error.message:String(error) } }, requestId); }
    }

    if (req.method === "POST" && url.pathname === "/api/v1/ai/media/generate") {
      const body = await bodyJson(req) as { kind?: "image" | "video" | "audio"; prompt?: string; model?: string; options?: Record<string, unknown> };
      if (!body.kind || !["image", "video", "audio"].includes(body.kind)) {
        return json(res, 400, { error: { code: "AI_MEDIA_KIND_REQUIRED", message: "kind must be image, video, or audio" } }, requestId);
      }
      if (!String(body.prompt ?? "").trim()) {
        return json(res, 400, { error: { code: "AI_MEDIA_PROMPT_REQUIRED", message: "A media generation prompt is required" } }, requestId);
      }
      try {
        const result = await generateMedia({ kind: body.kind, prompt: String(body.prompt), model: body.model, options: body.options });
        return json(res, result.status === "queued" ? 202 : 200, result, requestId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const notConfigured = /NOT_CONFIGURED/.test(message);
        return json(res, notConfigured ? 503 : 502, { error: { code: message, message: notConfigured ? `Connect a ${body.kind} generation provider before using this lane.` : `${body.kind} generation failed.` } }, requestId);
      }
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/ai/generate"
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

      let requestProviders;
      if (String(b.accessMode ?? "") === "provider") {
        const credential = await loadProviderCredential(db, membership.organizationId, String(b.provider ?? ""));
        if (!credential || !credential.endpoint) return json(res,400,{error:{code:"AI_PROVIDER_NOT_CONNECTED",message:"Connect this AI provider with an endpoint and API key first."}},requestId);
        requestProviders=[{name:credential.provider,endpoint:credential.endpoint,apiKey:credential.apiKey,models:credential.model?{[String(b.task ?? "write")]:credential.model}:undefined}];
      }

      const result =
        await runAiGateway(
          db,
          {
            ...b,
            userId,
            organizationId:
              membership.organizationId,
            plan: ent.plan,
          },
          requestProviders
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

    if (req.method === "GET" && url.pathname === "/api/v1/ai-credits/packs") {
      return json(res,200,{items:Object.values(AI_CREDIT_PACKS).map(({stripePriceEnv,...pack})=>pack)},requestId);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/ai/community-budget") {
      const status=await communityBudgetStatus(db);
      return json(res,200,{month:status.month,limitUsd:status.limitMicros/1_000_000,usedUsd:status.usedMicros/1_000_000,remainingUsd:status.remainingMicros/1_000_000,available:status.available},requestId);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/ai/providers/credentials") {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      return json(res,200,{items:await listProviderCredentials(db,membershipForUser.organizationId)},requestId);
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/v1/ai/providers/test/")) {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      if(!["owner","admin"].includes(membershipForUser.role))return json(res,403,{error:{code:"FORBIDDEN",message:"Owner or admin access is required."}},requestId);
      const provider=decodeURIComponent(url.pathname.slice("/api/v1/ai/providers/test/".length));
      try{return json(res,200,await testProviderCredential(db,membershipForUser.organizationId,provider,userId),requestId)}catch(error){return json(res,400,{error:{code:"AI_PROVIDER_TEST_FAILED",message:error instanceof Error?error.message:"Provider test failed"}},requestId)}
    }

    if (req.method === "POST" && url.pathname === "/api/v1/ai/providers/rotate-key") {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      if(!["owner","admin"].includes(membershipForUser.role))return json(res,403,{error:{code:"FORBIDDEN",message:"Owner or admin access is required."}},requestId);
      try{const rotated=await rotateProviderCredentials(db,membershipForUser.organizationId,userId);return json(res,200,{rotated},requestId)}catch(error){return json(res,400,{error:{code:"AI_PROVIDER_KEY_ROTATION_FAILED",message:error instanceof Error?error.message:"Credential rotation failed"}},requestId)}
    }

    if (req.method === "GET" && url.pathname === "/api/v1/ai/usage") {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      const organizationId=membershipForUser.organizationId;
      const [credits,community,providers]=await Promise.all([db.find("aiCreditTransactions",x=>x.organizationId===organizationId),db.find("aiCommunityTransactions",x=>x.organizationId===organizationId),listProviderCredentials(db,organizationId)]);
      const status=await communityBudgetStatus(db);
      return json(res,200,{creditBalance:credits.reduce((n,x)=>n+x.credits,0),creditTransactions:credits.slice(-100).reverse(),communityBudget:{month:status.month,limitUsd:status.limitMicros/1_000_000,usedUsd:status.usedMicros/1_000_000,remainingUsd:status.remainingMicros/1_000_000},communityTransactions:community.slice(-100).reverse().map(x=>({...x,metadata:{...x.metadata,prompt:undefined}})),providers},requestId);
    }

    if (req.method === "PUT" && url.pathname === "/api/v1/ai/providers/credentials") {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      if(!["owner","admin"].includes(membershipForUser.role))return json(res,403,{error:{code:"FORBIDDEN",message:"Owner or admin access is required to manage provider credentials."}},requestId);
      const b=await bodyJson(req);
      try{const saved=await saveProviderCredential(db,{organizationId:membershipForUser.organizationId,actorUserId:userId,provider:String(b.provider??""),apiKey:String(b.apiKey??""),endpoint:String(b.endpoint??""),model:String(b.model??"")});return json(res,200,{provider:saved.provider,endpoint:saved.endpoint,model:saved.model,keyLast4:saved.keyLast4},requestId)}catch(error){return json(res,400,{error:{code:"AI_PROVIDER_CREDENTIAL_REJECTED",message:error instanceof Error?error.message:"Credential could not be saved"}},requestId)}
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/v1/ai/providers/credentials/")) {
      if(!membershipForUser)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      if(!["owner","admin"].includes(membershipForUser.role))return json(res,403,{error:{code:"FORBIDDEN",message:"Owner or admin access is required to manage provider credentials."}},requestId);
      const provider=decodeURIComponent(url.pathname.slice("/api/v1/ai/providers/credentials/".length));
      return json(res,200,{deleted:await deleteProviderCredential(db,membershipForUser.organizationId,provider,userId)},requestId);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/ai-credits/balance") {
      const membership=(await db.find("memberships",m=>m.userId===userId))[0];
      if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      return json(res,200,{balance:await creditBalance(db,membership.organizationId)},requestId);
    }

    if (req.method === "POST" && url.pathname === "/api/v1/ai-credits/checkout") {
      const b=await bodyJson(req); try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)} const pack=getCreditPack(String(b.pack??""));
      if(!pack)return json(res,400,{error:{code:"INVALID_CREDIT_PACK",message:"Choose a valid AI credit pack."}},requestId);
      for(const candidate of [String(b.successUrl??""),String(b.cancelUrl??"")]){let target:URL;try{target=new URL(candidate)}catch{return json(res,400,{error:{code:"INVALID_RETURN_URL",message:"A valid checkout return URL is required."}},requestId)}if(!isOriginAllowed(target.origin,securityConfig.publicOrigins))return json(res,400,{error:{code:"UNTRUSTED_RETURN_URL",message:"Checkout return URL is not allowed."}},requestId)}
      const membership=(await db.find("memberships",m=>m.userId===userId))[0];
      if(!membership)return json(res,404,{error:{code:"NO_ORGANIZATION",message:"Organization not found"}},requestId);
      const priceId=process.env[pack.stripePriceEnv]; if(!priceId)return json(res,503,{error:{code:"AI_CREDITS_NOT_CONFIGURED",message:"AI credit checkout is not configured on this deployment."}},requestId);
      const sub=(await db.find("subscriptions",x=>x.organizationId===membership.organizationId))[0];
      const session=await createAICreditCheckoutSession({customerId:sub?.providerCustomerId,priceId,successUrl:String(b.successUrl),cancelUrl:String(b.cancelUrl),organizationId:membership.organizationId,pack:pack.id});
      return json(res,200,{id:session.id,url:session.url},requestId);
    }

    if (
      req.method === "POST" &&
      url.pathname ===
        "/api/v1/billing/checkout"
    ) {
      const b = await bodyJson(req);
      try{await rejectRawPaymentData(db,userId,b)}catch{return json(res,400,{error:{code:"RAW_PAYMENT_DATA_NOT_ACCEPTED",message:"For your security, enter card details only on the hosted Stripe checkout page. Yaposan does not accept or store card numbers or CVC."}},requestId)}

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

      const exportProject = await requireProjectAccess(
        db,
        userId,
        String(b.projectId),
        false
      );

      await requireWorkspaceAccess(
        db,
        userId,
        exportProject.workspaceId,
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
                workspaceId: exportProject.workspaceId,
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


    // Yaposan 116.0 — production completion, payment integrity and trust/safety.
    if(req.method==="GET"&&url.pathname==="/api/v1/social/notifications/center") return json(res,200,await notificationCenter(db,userId,Number(url.searchParams.get("limit")??50)),requestId);
    if(req.method==="POST"&&url.pathname==="/api/v1/social/notifications/read-all") return json(res,200,await markAllNotificationsRead(db,userId),requestId);
    if(req.method==="POST"&&url.pathname==="/api/v1/social/moderation/appeals"){const b=await bodyJson(req);return json(res,201,{appeal:await createModerationAppeal(db,userId,b as any)},requestId);}
    if(req.method==="PUT"&&url.pathname==="/api/v1/social/safety-profile"){const b=await bodyJson(req);return json(res,200,{profile:await setAgeSafetyProfile(db,userId,String(b.ageBand??"") as any,Boolean(b.guardianConsent))},requestId);}
    if(req.method==="GET"&&url.pathname==="/api/v1/creator/payout-safety") return json(res,200,await creatorPayoutSafety(db,userId,String(url.searchParams.get("currency")??"USD").toUpperCase()),requestId);

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

  initializeLocalDevToken();
  const cleanupLocalDevToken=()=>{if(localDevToken){try{rmSync(localDevTokenPath,{force:true})}catch{};localDevToken=""}};
  process.once("exit",cleanupLocalDevToken);

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

const isDirectExecution = Boolean(
  process.argv[1] && /(?:^|[\\/])server[\\/]index\.(?:ts|js|mjs|cjs)$/.test(process.argv[1])
);

if (isDirectExecution) {
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
