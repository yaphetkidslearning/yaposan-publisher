export type CloudConfig = {
  databaseUrl?: string;
  sessionSecret: string;
  accessTokenMinutes: number;
  refreshTokenDays: number;
  storageDriver: "local" | "r2";
  storageBucket: string;
  storageRegion?: string;
  storageEndpoint?: string;
  publicAssetBaseUrl?: string;
  redisUrl?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  openAiApiKey?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  resendApiKey?: string;
  emailFrom?: string;
  publicWebUrl?: string;
  adminSessionSecret: string;
  adminBootstrapEmail?: string;
  adminBootstrapPassword?: string;
  adminSessionHours: number;
  collaborationDriver: "memory" | "redis";
  exportWorkerEnabled: boolean;
  exportWorkerToken?: string;
  r2SigningRegion: string;
  localStorageRoot?: string;
  exportWorkerId: string;
  exportJobLeaseSeconds: number;
  exportWorkerPollMs: number;
  productPhotoWorkerToken?: string;
  productPhotoWorkerId: string;
  productPhotoJobLeaseSeconds: number;
  productPhotoWorkerPollMs: number;
  ffmpegPath?: string;
  rendererTimeoutMs: number;
  licenseSigningSecret?: string;
  requireEmailVerification: boolean;
  trustProxy: boolean;
  requestTimeoutMs: number;
  shutdownTimeoutMs: number;
  readinessTimeoutMs: number;
  readinessStorageProbe: boolean;
  metricsToken?: string;
  maxRequestBodyBytes: number;
  maxJsonDepth: number;
  maxJsonNodes: number;
  maxQueryParameters: number;
  rateLimitPerMinute: number;
  rateLimitMaxEntries: number;
  identityProvider: "local"|"oidc";
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcAudience?: string;
  requireExternalIdentity: boolean;
  malwareScannerUrl?: string;
  securityEventSink: "stdout"|"off";
};

const storageDriverEnv = (env: NodeJS.ProcessEnv): CloudConfig["storageDriver"] => {
  const value = (env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  if (value === "local" || value === "r2") return value;
  throw new Error(`Unsupported STORAGE_DRIVER=${value}. Supported drivers: local, r2`);
};

const numberEnv = (env: NodeJS.ProcessEnv, name: string, fallback: number) => {
  const value = Number(env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export function loadCloudConfig(env = process.env): CloudConfig {
  return {
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET ?? "development-only-change-me",
    accessTokenMinutes: numberEnv(env, "ACCESS_TOKEN_MINUTES", 15),
    refreshTokenDays: numberEnv(env, "REFRESH_TOKEN_DAYS", 30),
    storageDriver: storageDriverEnv(env),
    storageBucket: env.STORAGE_BUCKET ?? "yaposan-assets",
    storageRegion: env.STORAGE_REGION,
    storageEndpoint: env.STORAGE_ENDPOINT,
    publicAssetBaseUrl: env.PUBLIC_ASSET_BASE_URL,
    redisUrl: env.REDIS_URL,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    openAiApiKey: env.OPENAI_API_KEY,
    r2AccessKeyId: env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    publicWebUrl: (env.PUBLIC_WEB_URL ?? env.PUBLIC_APP_URL ?? env.APP_URL)?.trim() || undefined,
    adminSessionSecret: env.ADMIN_SESSION_SECRET ?? "development-admin-change-me",
    adminBootstrapEmail: env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase() || undefined,
    adminBootstrapPassword: env.ADMIN_BOOTSTRAP_PASSWORD || undefined,
    adminSessionHours: numberEnv(env, "ADMIN_SESSION_HOURS", 8),
    collaborationDriver: env.COLLABORATION_DRIVER === "redis" ? "redis" : "memory",
    exportWorkerEnabled: env.EXPORT_WORKER_ENABLED === "true",
    exportWorkerToken: env.EXPORT_WORKER_TOKEN,
    r2SigningRegion: env.R2_SIGNING_REGION ?? "auto",
    localStorageRoot: env.LOCAL_STORAGE_ROOT,
    exportWorkerId: env.EXPORT_WORKER_ID ?? `export-worker-${process.pid}`,
    exportJobLeaseSeconds: numberEnv(env, "EXPORT_JOB_LEASE_SECONDS", 60),
    exportWorkerPollMs: numberEnv(env, "EXPORT_WORKER_POLL_MS", 1000),
    productPhotoWorkerToken: env.PRODUCT_PHOTO_WORKER_TOKEN,
    productPhotoWorkerId: env.PRODUCT_PHOTO_WORKER_ID ?? `product-photo-worker-${process.pid}`,
    productPhotoJobLeaseSeconds: numberEnv(env, "PRODUCT_PHOTO_JOB_LEASE_SECONDS", 120),
    productPhotoWorkerPollMs: numberEnv(env, "PRODUCT_PHOTO_WORKER_POLL_MS", 1000),
    ffmpegPath: env.FFMPEG_PATH,
    rendererTimeoutMs: numberEnv(env, "RENDERER_TIMEOUT_MS", 120000),
    licenseSigningSecret: env.LICENSE_SIGNING_SECRET,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== "false",
    trustProxy: env.TRUST_PROXY === "true",
    requestTimeoutMs: numberEnv(env, "REQUEST_TIMEOUT_MS", 30000),
    shutdownTimeoutMs: numberEnv(env, "SHUTDOWN_TIMEOUT_MS", 15000),
    readinessTimeoutMs: numberEnv(env, "READINESS_TIMEOUT_MS", 5000),
    readinessStorageProbe: env.READINESS_STORAGE_PROBE === "true",
    metricsToken: env.METRICS_TOKEN,
    maxRequestBodyBytes: numberEnv(env, "MAX_REQUEST_BODY_BYTES", 20_000_000),
    maxJsonDepth: numberEnv(env, "MAX_JSON_DEPTH", 32),
    maxJsonNodes: numberEnv(env, "MAX_JSON_NODES", 50_000),
    maxQueryParameters: numberEnv(env, "MAX_QUERY_PARAMETERS", 100),
    rateLimitPerMinute: numberEnv(env, "RATE_LIMIT_PER_MINUTE", 120),
    rateLimitMaxEntries: numberEnv(env, "RATE_LIMIT_MAX_ENTRIES", 50_000),
    identityProvider: env.IDENTITY_PROVIDER === "oidc" ? "oidc" : "local",
    oidcIssuer: env.OIDC_ISSUER?.trim() || undefined,
    oidcClientId: env.OIDC_CLIENT_ID?.trim() || undefined,
    oidcAudience: env.OIDC_AUDIENCE?.trim() || undefined,
    requireExternalIdentity: env.REQUIRE_EXTERNAL_IDENTITY === "true",
    malwareScannerUrl: env.MALWARE_SCANNER_URL?.trim() || undefined,
    securityEventSink: env.SECURITY_EVENT_SINK === "off" ? "off" : "stdout",
  };
}

export function validateProductionConfig(config: CloudConfig, nodeEnv = process.env.NODE_ENV) {
  const issues: string[] = [];
  if (nodeEnv === "production" && !config.databaseUrl) issues.push("DATABASE_URL is required in production");
  if (nodeEnv === "production" && config.sessionSecret === "development-only-change-me") issues.push("SESSION_SECRET must be changed in production");
  if (config.storageDriver === "r2" && !config.storageBucket) issues.push("STORAGE_BUCKET is required for cloud storage");
  if (nodeEnv === "production" && config.storageDriver === "r2" && (!config.storageEndpoint || !config.r2AccessKeyId || !config.r2SecretAccessKey)) issues.push("R2 storage requires STORAGE_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
  if (nodeEnv === "production" && config.collaborationDriver === "redis" && !config.redisUrl) issues.push("REDIS_URL is required for Redis collaboration");
  if (nodeEnv === "production" && !config.stripeSecretKey) issues.push("STRIPE_SECRET_KEY is required for paid checkout");
  if (nodeEnv === "production" && !config.stripeWebhookSecret) issues.push("STRIPE_WEBHOOK_SECRET is required for subscription synchronization");
  if (nodeEnv === "production" && !config.openAiApiKey) issues.push("OPENAI_API_KEY is required for AI features");
  if (nodeEnv === "production" && (config.adminSessionSecret === "development-admin-change-me" || config.adminSessionSecret.length < 32)) issues.push("ADMIN_SESSION_SECRET must be a dedicated secret of at least 32 characters in production");
  const bootstrapConfigured = Boolean(config.adminBootstrapEmail || config.adminBootstrapPassword);
  if (bootstrapConfigured && (!config.adminBootstrapEmail || !config.adminBootstrapPassword)) issues.push("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be configured together");
  if (bootstrapConfigured && (config.adminBootstrapPassword?.length ?? 0) < 14) issues.push("ADMIN_BOOTSTRAP_PASSWORD must be at least 14 characters when bootstrap access is enabled");
  if (nodeEnv === "production" && (!config.licenseSigningSecret || config.licenseSigningSecret.length < 32)) issues.push("LICENSE_SIGNING_SECRET must be at least 32 characters in production");
  if (nodeEnv === "production" && config.exportWorkerEnabled && !config.exportWorkerToken) issues.push("EXPORT_WORKER_TOKEN is required when export workers are enabled");
  if (nodeEnv === "production" && config.exportWorkerEnabled && config.storageDriver !== "r2") issues.push("STORAGE_DRIVER=r2 is required for durable multi-worker export publication");
  if (nodeEnv === "production" && !config.productPhotoWorkerToken) issues.push("PRODUCT_PHOTO_WORKER_TOKEN is required for durable product photo batch processing");
  if (nodeEnv === "production" && config.storageDriver !== "r2") issues.push("STORAGE_DRIVER=r2 is required for durable multi-worker product photo batches");
  if (config.rendererTimeoutMs < 1000 || config.rendererTimeoutMs > 900000) issues.push("RENDERER_TIMEOUT_MS must be between 1000 and 900000");
  if (config.requestTimeoutMs < 1000 || config.requestTimeoutMs > 120000) issues.push("REQUEST_TIMEOUT_MS must be between 1000 and 120000");
  if (config.shutdownTimeoutMs < 1000 || config.shutdownTimeoutMs > 120000) issues.push("SHUTDOWN_TIMEOUT_MS must be between 1000 and 120000");
  if (config.readinessTimeoutMs < 250 || config.readinessTimeoutMs > 30000) issues.push("READINESS_TIMEOUT_MS must be between 250 and 30000");
  if (nodeEnv === "production" && (!config.metricsToken || config.metricsToken.length < 24)) issues.push("METRICS_TOKEN must be at least 24 characters in production");
  if (config.maxRequestBodyBytes < 1024 || config.maxRequestBodyBytes > 100_000_000) issues.push("MAX_REQUEST_BODY_BYTES must be between 1024 and 100000000");
  if (config.maxJsonDepth < 4 || config.maxJsonDepth > 128) issues.push("MAX_JSON_DEPTH must be between 4 and 128");
  if (config.maxJsonNodes < 100 || config.maxJsonNodes > 1_000_000) issues.push("MAX_JSON_NODES must be between 100 and 1000000");
  if (config.maxQueryParameters < 1 || config.maxQueryParameters > 1000) issues.push("MAX_QUERY_PARAMETERS must be between 1 and 1000");
  if (config.rateLimitPerMinute < 1 || config.rateLimitPerMinute > 10000) issues.push("RATE_LIMIT_PER_MINUTE must be between 1 and 10000");
  if (config.rateLimitMaxEntries < 100 || config.rateLimitMaxEntries > 1_000_000) issues.push("RATE_LIMIT_MAX_ENTRIES must be between 100 and 1000000");
  if (nodeEnv === "production" && config.collaborationDriver !== "redis") issues.push("COLLABORATION_DRIVER=redis is required for multi-instance production collaboration");
  if (config.identityProvider === "oidc" && (!config.oidcIssuer || !config.oidcClientId)) issues.push("OIDC_ISSUER and OIDC_CLIENT_ID are required when IDENTITY_PROVIDER=oidc");
  if (nodeEnv === "production" && config.requireExternalIdentity && config.identityProvider !== "oidc") issues.push("IDENTITY_PROVIDER=oidc is required when REQUIRE_EXTERNAL_IDENTITY=true");
  if (nodeEnv === "production" && config.identityProvider === "local" && config.requireEmailVerification && !config.resendApiKey) issues.push("RESEND_API_KEY is required in production when local email verification is enabled");
  if (nodeEnv === "production" && config.identityProvider === "local" && config.requireEmailVerification && !config.emailFrom) issues.push("EMAIL_FROM is required in production when local email verification is enabled");
  if (nodeEnv === "production" && config.identityProvider === "local" && config.requireEmailVerification && !config.publicWebUrl) issues.push("PUBLIC_WEB_URL is required in production for verification and password-reset links");
  if (nodeEnv === "production" && config.adminBootstrapEmail && (/\.(local|localhost)$/i.test(config.adminBootstrapEmail) || config.adminBootstrapEmail.endsWith("@localhost"))) issues.push("ADMIN_BOOTSTRAP_EMAIL must be a deliverable email address in production so Admin password recovery works");
  if (nodeEnv === "production" && config.identityProvider === "local") issues.push("Production local-password identity is legacy fallback; configure IDENTITY_PROVIDER=oidc for Keycloak/ZITADEL-class identity security");
  return issues;
}
