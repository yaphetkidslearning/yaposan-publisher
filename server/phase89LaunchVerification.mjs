import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const PHASE89_GATES = [
  "auth_end_to_end",
  "authorization_isolation",
  "production_environment",
  "database_migrations",
  "backup_restore_drill",
  "security_regression",
  "export_reliability",
  "billing_reconciliation",
  "ai_cost_safety",
  "performance_load",
  "accessibility_remediation",
  "browser_device_regression",
  "monitoring_incident_readiness",
];

const TRUE = "true";
const requiredFiles = [
  "scripts/phase89-launch-verification.mjs",
  "docs/PHASE89-LAUNCH-VERIFICATION-AND-REMEDIATION.md",
  "docs/PHASE89-BACKUP-RESTORE-DRILL.md",
  "docs/PHASE89-INCIDENT-RESPONSE-RUNBOOK.md",
  "release/phase89/evidence-template.json",
];

function fileHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function evaluatePhase89(root = process.cwd(), env = process.env) {
  const checks = {
    authEndToEnd: env.PHASE89_AUTH_E2E_VERIFIED === TRUE,
    authorizationIsolation: env.PHASE89_AUTHZ_ISOLATION_VERIFIED === TRUE,
    productionEnvironment: env.PHASE89_ENVIRONMENT_VERIFIED === TRUE,
    databaseMigrations: env.PHASE89_MIGRATIONS_VERIFIED === TRUE,
    backupRestoreDrill: env.PHASE89_BACKUP_RESTORE_VERIFIED === TRUE,
    securityRegression: env.PHASE89_SECURITY_VERIFIED === TRUE,
    exportReliability: env.PHASE89_EXPORT_VERIFIED === TRUE,
    billingReconciliation: env.PHASE89_BILLING_VERIFIED === TRUE,
    aiCostSafety: env.PHASE89_AI_SAFETY_VERIFIED === TRUE,
    performanceLoad: env.PHASE89_PERFORMANCE_VERIFIED === TRUE,
    accessibilityRemediation: env.PHASE89_ACCESSIBILITY_VERIFIED === TRUE,
    browserDeviceRegression: env.PHASE89_BROWSER_MATRIX_VERIFIED === TRUE,
    monitoringIncidentReadiness: env.PHASE89_INCIDENT_READINESS_VERIFIED === TRUE,
  };
  const sourceEvidencePresent = requiredFiles.every(file => fs.existsSync(path.join(root, file)));
  const lockFile = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"]
    .map(file => path.join(root, file)).find(fs.existsSync);
  const manifest = {
    generatedAt: new Date().toISOString(),
    gitCommit: env.GIT_COMMIT || env.RENDER_GIT_COMMIT || "unrecorded",
    schemaVersion: env.DATABASE_SCHEMA_VERSION || "unrecorded",
    lockFile: lockFile ? path.basename(lockFile) : null,
    lockFileSha256: lockFile ? fileHash(lockFile) : null,
    sourceEvidencePresent,
    checks,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;
  const status = passedCount === totalCount && sourceEvidencePresent
    ? "pass"
    : passedCount >= 10 && sourceEvidencePresent
      ? "conditional-pass"
      : "fail";
  const digest = crypto.createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  return { ...manifest, passedCount, totalCount, status, digest };
}

export function writePhase89Evidence(root = process.cwd(), env = process.env) {
  const result = evaluatePhase89(root, env);
  const outDir = path.join(root, "release", "phase89");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "launch-verification-report.json"), JSON.stringify(result, null, 2));
  return result;
}
