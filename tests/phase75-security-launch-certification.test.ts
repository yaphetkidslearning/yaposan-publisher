import test from "node:test";
import assert from "node:assert/strict";
import { buildBackupPlan, certifyLaunch, createCsrfToken, evaluateLaunchReadiness, isOriginAllowed, passwordPolicy, redactLogValue, securityHeaders, validateUpload, verifyCsrfToken } from "../server/securityPlatform.ts";

test("security headers, origins and CSRF tokens are hardened", () => {
  const headers = securityHeaders("req-1", true);
  assert.equal(headers["x-frame-options"], "DENY");
  assert.match(headers["strict-transport-security"], /includeSubDomains/);
  assert.equal(isOriginAllowed("https://app.yaposan.com/", ["https://app.yaposan.com"]), true);
  assert.equal(isOriginAllowed("https://evil.example", ["https://app.yaposan.com"]), false);
  const token = createCsrfToken("session-1", "x".repeat(40), Date.now());
  assert.equal(verifyCsrfToken(token, "session-1", "x".repeat(40)), true);
  assert.equal(verifyCsrfToken(token, "session-2", "x".repeat(40)), false);
});

test("password and upload policies reject unsafe input", () => {
  assert.equal(passwordPolicy("weak", "owner@example.com").valid, false);
  assert.equal(passwordPolicy("Strong!Passphrase2026", "owner@example.com").valid, true);
  const good = validateUpload({ name: "design.png", contentType: "image/png", size: 2048, checksum: "a".repeat(64) });
  assert.equal(good.valid, true);
  const bad = validateUpload({ name: "payload.exe", contentType: "application/octet-stream", size: 2048 });
  assert.equal(bad.valid, false);
});

test("logs are redacted and backups include recovery objectives", () => {
  const redacted = redactLogValue({ user: { email: "a@b.com", password: "secret" }, authorization: "Bearer abc" }) as any;
  assert.equal(redacted.user.password, "[REDACTED]");
  assert.equal(redacted.authorization, "[REDACTED]");
  const plan = buildBackupPlan({ storageDriver: "s3", retentionDays: 35 });
  assert.equal(plan.database.pointInTimeRecovery, true);
  assert.equal(plan.objects.crossRegionReplication, true);
  assert.equal(plan.recovery.targetRpoMinutes, 15);
});

test("launch certification is deterministic and blocks failed controls", () => {
  const env = { nodeEnv: "production", publicOrigins: ["https://app.yaposan.com"], sessionSecret: "s".repeat(48), databaseUrl: "postgres://db", storageDriver: "s3", storageBucket: "assets", stripeSecretKey: "sk_live", stripeWebhookSecret: "whsec", aiProviderKey: "ai", logLevel: "info" as const };
  const evidence = { testsPassed: 28, testsFailed: 0, typecheckPassed: true, buildPassed: true, backupRestoreTested: true, monitoringConfigured: true };
  const checks = evaluateLaunchReadiness(env, evidence);
  const certificate = certifyLaunch(checks);
  assert.equal(certificate.certified, true);
  assert.equal(certificate.checksum.length, 64);
  const failed = certifyLaunch(evaluateLaunchReadiness({ ...env, sessionSecret: "weak" }, evidence));
  assert.equal(failed.certified, false);
  assert.ok(failed.failed.includes("secret"));
});
