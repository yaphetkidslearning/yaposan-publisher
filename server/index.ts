import { randomUUID } from "node:crypto";
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
  isConfiguredAdmin,
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
  createAICreditCheckoutSession,
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

const supportTicketLimiter = new BoundedRateLimiter({
  limit: 5,
  windowMs: 60_000,
  maxEntries: config.rateLimitMaxEntries,
});

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

      const creditGrant = await grantPurchasedCredits(db,event);
      const creditReversal = creditGrant ? undefined : await applyStripeCreditReversal(db,event);
      if (!creditGrant && !creditReversal && process.env.YAPOSAN_ENABLE_LEGACY_SUBSCRIPTIONS === "true") await syncStripeSubscription(
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


    const currentUser=await db.get("users",userId);
    const isSupportAdmin=isConfiguredAdmin(currentUser?.email,config.adminEmails);
    if (req.method === "GET" && url.pathname === "/api/v1/admin/support/tickets") {
      if(!isSupportAdmin) return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required."}},requestId);
      const status=url.searchParams.get("status"); const q=(url.searchParams.get("q")??"").toLowerCase();
      const items=(await db.find("supportTickets",t=>(!status||t.status===status)&&(!q||`${t.id} ${t.email} ${t.name} ${t.subject} ${t.category}`.toLowerCase().includes(q)))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      return json(res,200,{items:items.slice(0,250).map(t=>({...t,attachmentStorageKey:undefined}))},requestId);
    }

    const adminSupportMatch=url.pathname.match(/^\/api\/v1\/admin\/support\/tickets\/([^/]+)$/);
    if (adminSupportMatch && req.method === "GET") {
      if(!isSupportAdmin) return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required."}},requestId);
      const ticket=await db.get("supportTickets",adminSupportMatch[1]); if(!ticket) return json(res,404,{error:{code:"SUPPORT_TICKET_NOT_FOUND",message:"Support ticket not found."}},requestId);
      const messages=(await db.find("supportTicketMessages",m=>m.ticketId===ticket.id)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
      return json(res,200,{ticket:{...ticket,attachmentStorageKey:undefined},messages:messages.map(m=>({...m,attachmentStorageKey:undefined}))},requestId);
    }
    const adminAttachmentMatch=url.pathname.match(/^\/api\/v1\/admin\/support\/tickets\/([^/]+)\/attachment$/);
    if(req.method==="GET"&&adminAttachmentMatch){
      if(!isSupportAdmin) return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required."}},requestId);
      const ticket=await db.get("supportTickets",adminAttachmentMatch[1]); if(!ticket?.attachmentStorageKey) return json(res,404,{error:{code:"SUPPORT_ATTACHMENT_NOT_FOUND",message:"Attachment not found."}},requestId);
      const bytes=await storage.get(ticket.attachmentStorageKey);
      res.writeHead(200,{"content-type":ticket.attachmentMimeType??"application/octet-stream","content-disposition":`attachment; filename="${String(ticket.attachmentName??"support-attachment").replace(/[\r\n"]/g,"")}"`,...securityHeaders(requestId)});res.end(Buffer.from(bytes));return;
    }

    if (adminSupportMatch && req.method === "PATCH") {
      if(!isSupportAdmin) return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required."}},requestId);
      const b=await bodyJson(req) as {status?:string}; const status=String(b.status??"");
      if(!supportTicketStatuses.has(status)) return json(res,400,{error:{code:"SUPPORT_STATUS_INVALID",message:"Invalid support ticket status."}},requestId);
      const ticket=await db.update("supportTickets",adminSupportMatch[1],{status:status as any});
      await db.insert("supportTicketMessages",{ticketId:ticket.id,authorUserId:userId,authorType:"system",body:`Status changed to ${status.replaceAll("_"," ")}.`});
      return json(res,200,{ticket:{...ticket,attachmentStorageKey:undefined}},requestId);
    }
    const adminNoteMatch=url.pathname.match(/^\/api\/v1\/admin\/support\/tickets\/([^/]+)\/messages$/);
    if (adminNoteMatch && req.method === "POST") {
      if(!isSupportAdmin) return json(res,403,{error:{code:"ADMIN_REQUIRED",message:"Administrator access required."}},requestId);
      const ticket=await db.get("supportTickets",adminNoteMatch[1]); if(!ticket) return json(res,404,{error:{code:"SUPPORT_TICKET_NOT_FOUND",message:"Support ticket not found."}},requestId);
      const b=await bodyJson(req) as {message?:string}; const body=String(b.message??"").trim().slice(0,10000); if(body.length<2) return json(res,400,{error:{code:"SUPPORT_REPLY_REQUIRED",message:"Message cannot be empty."}},requestId);
      const message=await db.insert("supportTicketMessages",{ticketId:ticket.id,authorUserId:userId,authorType:"staff",body});
      await db.update("supportTickets",ticket.id,{status:"waiting_for_user"});
      return json(res,201,{message},requestId);
    }

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
      const b=await bodyJson(req); const pack=getCreditPack(String(b.pack??""));
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
