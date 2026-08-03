import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type SecurityEnvironment = {
  nodeEnv?: string;
  publicOrigins: string[];
  sessionSecret: string;
  databaseUrl?: string;
  storageDriver: string;
  storageBucket?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  aiProviderKey?: string;
  logLevel: "debug" | "info" | "warn" | "error";
};

export type UploadPolicy = {
  maxBytes: number;
  allowedMimeTypes: string[];
  blockedExtensions: string[];
  requireChecksum: boolean;
};

export type LaunchCheck = {
  id: string;
  category: "security" | "data" | "infrastructure" | "operations" | "quality";
  status: "pass" | "warn" | "fail";
  message: string;
};

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, "").toLowerCase();
const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function loadSecurityEnvironment(env = process.env): SecurityEnvironment {
  return {
    nodeEnv: env.NODE_ENV,
    publicOrigins: String(env.PUBLIC_ORIGINS ?? "http://localhost:8081,http://localhost:19006")
      .split(",")
      .map(normalizeOrigin)
      .filter(Boolean),
    sessionSecret: env.SESSION_SECRET ?? "development-only-change-me",
    databaseUrl: env.DATABASE_URL,
    storageDriver: env.STORAGE_DRIVER ?? "local",
    storageBucket: env.STORAGE_BUCKET,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    aiProviderKey: env.OPENAI_API_KEY ?? env.AI_FALLBACK_API_KEY,
    logLevel: (env.LOG_LEVEL as SecurityEnvironment["logLevel"]) ?? "info",
  };
}

export function securityHeaders(requestId: string, production = process.env.NODE_ENV === "production") {
  return {
    "x-request-id": requestId,
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-site",
    "strict-transport-security": production ? "max-age=63072000; includeSubDomains; preload" : "max-age=0",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    "cache-control": "no-store",
  } as Record<string, string>;
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
}

export function createCsrfToken(sessionId: string, secret: string, issuedAt = Date.now()) {
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${sessionId}.${issuedAt}.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyCsrfToken(token: string | undefined, sessionId: string, secret: string, maxAgeMs = 2 * 60 * 60 * 1000) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [tokenSessionId, issuedAt, nonce, signature] = parts;
  if (tokenSessionId !== sessionId || !nonce) return false;
  const timestamp = Number(issuedAt);
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 60_000 || Date.now() - timestamp > maxAgeMs) return false;
  const payload = `${tokenSessionId}.${issuedAt}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  return safeEqual(signature, expected);
}

export function passwordPolicy(password: string, email?: string) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Password must contain at least 12 characters");
  if (!/[a-z]/.test(password)) issues.push("Password must contain a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("Password must contain an uppercase letter");
  if (!/\d/.test(password)) issues.push("Password must contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Password must contain a symbol");
  const localPart = email?.split("@")[0]?.toLowerCase();
  if (localPart && localPart.length >= 4 && password.toLowerCase().includes(localPart)) issues.push("Password must not contain the email name");
  return { valid: issues.length === 0, issues };
}

export const DEFAULT_UPLOAD_POLICY: UploadPolicy = {
  maxBytes: 250 * 1024 * 1024,
  allowedMimeTypes: [
    "image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff", "image/svg+xml",
    "application/pdf", "application/zip", "font/ttf", "font/otf", "font/woff", "font/woff2",
    "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "application/json",
  ],
  blockedExtensions: ["exe", "dll", "com", "bat", "cmd", "msi", "ps1", "sh", "scr", "jar"],
  requireChecksum: true,
};

export function validateUpload(input: { name: string; contentType: string; size: number; checksum?: string }, policy = DEFAULT_UPLOAD_POLICY) {
  const issues: string[] = [];
  const extension = input.name.toLowerCase().split(".").pop() ?? "";
  if (!Number.isFinite(input.size) || input.size <= 0) issues.push("File size must be positive");
  if (input.size > policy.maxBytes) issues.push(`File exceeds ${policy.maxBytes} byte limit`);
  if (!policy.allowedMimeTypes.includes(input.contentType.toLowerCase())) issues.push("File type is not allowed");
  if (policy.blockedExtensions.includes(extension)) issues.push("Executable file extension is blocked");
  if (policy.requireChecksum && !/^[a-f0-9]{64}$/i.test(input.checksum ?? "")) issues.push("SHA-256 checksum is required");
  if (input.contentType === "image/svg+xml" && extension !== "svg") issues.push("SVG MIME type and extension must match");
  return { valid: issues.length === 0, issues };
}

export function redactLogValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactLogValue);
  if (!value || typeof value !== "object") return value;
  const sensitive = /password|secret|token|authorization|cookie|api[-_]?key|card|cvv/i;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sensitive.test(key) ? "[REDACTED]" : redactLogValue(item)]));
}

export function buildBackupPlan(input: { databaseProvider?: string; storageDriver: string; retentionDays?: number; region?: string }) {
  const retentionDays = Math.max(7, input.retentionDays ?? 35);
  return {
    database: {
      provider: input.databaseProvider ?? "postgresql",
      schedule: "0 2 * * *",
      pointInTimeRecovery: true,
      encrypted: true,
      retentionDays,
    },
    objects: {
      driver: input.storageDriver,
      versioning: true,
      lifecycleDays: Math.max(retentionDays, 90),
      crossRegionReplication: input.storageDriver !== "local",
      region: input.region ?? "us-east-1",
    },
    recovery: { quarterlyRestoreDrill: true, targetRpoMinutes: 15, targetRtoMinutes: 60 },
  };
}

export function evaluateLaunchReadiness(env: SecurityEnvironment, evidence: { testsPassed: number; testsFailed: number; typecheckPassed: boolean; buildPassed: boolean; backupRestoreTested: boolean; monitoringConfigured: boolean }): LaunchCheck[] {
  const checks: LaunchCheck[] = [];
  const production = env.nodeEnv === "production";
  checks.push({ id: "secret", category: "security", status: env.sessionSecret.length >= 32 && env.sessionSecret !== "development-only-change-me" ? "pass" : "fail", message: "Session signing secret is production strength" });
  checks.push({ id: "origins", category: "security", status: env.publicOrigins.length > 0 && !env.publicOrigins.includes("*") ? "pass" : "fail", message: "Explicit trusted origins are configured" });
  checks.push({ id: "database", category: "data", status: env.databaseUrl ? "pass" : production ? "fail" : "warn", message: "Persistent PostgreSQL database is configured" });
  checks.push({ id: "storage", category: "data", status: env.storageDriver !== "local" && Boolean(env.storageBucket) ? "pass" : production ? "fail" : "warn", message: "Durable object storage is configured" });
  checks.push({ id: "stripe", category: "infrastructure", status: env.stripeSecretKey && env.stripeWebhookSecret ? "pass" : "warn", message: "Stripe billing credentials are configured" });
  checks.push({ id: "ai", category: "infrastructure", status: env.aiProviderKey ? "pass" : "warn", message: "At least one AI provider is configured" });
  checks.push({ id: "tests", category: "quality", status: evidence.testsFailed === 0 && evidence.testsPassed > 0 ? "pass" : "fail", message: `${evidence.testsPassed} tests passed and ${evidence.testsFailed} failed` });
  checks.push({ id: "typecheck", category: "quality", status: evidence.typecheckPassed ? "pass" : "fail", message: "TypeScript validation completed" });
  checks.push({ id: "build", category: "quality", status: evidence.buildPassed ? "pass" : "fail", message: "Production build completed" });
  checks.push({ id: "restore", category: "operations", status: evidence.backupRestoreTested ? "pass" : "warn", message: "Backup restoration has been tested" });
  checks.push({ id: "monitoring", category: "operations", status: evidence.monitoringConfigured ? "pass" : "warn", message: "Monitoring and alerting are configured" });
  return checks;
}

export function certifyLaunch(checks: LaunchCheck[]) {
  const failed = checks.filter(check => check.status === "fail");
  const warned = checks.filter(check => check.status === "warn");
  const payload = JSON.stringify(checks.map(({ id, status, message }) => ({ id, status, message })).sort((a, b) => a.id.localeCompare(b.id)));
  return {
    certified: failed.length === 0,
    failed: failed.map(check => check.id),
    warnings: warned.map(check => check.id),
    checksum: createHash("sha256").update(payload).digest("hex"),
    generatedAt: new Date().toISOString(),
  };
}
