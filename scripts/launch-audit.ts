import { certifyLaunch, evaluateLaunchReadiness, loadSecurityEnvironment } from "../server/securityPlatform.ts";
const evidence = {
  testsPassed: Number(process.env.TESTS_PASSED ?? 0),
  testsFailed: Number(process.env.TESTS_FAILED ?? 0),
  typecheckPassed: process.env.TYPECHECK_PASSED === "true",
  buildPassed: process.env.BUILD_PASSED === "true",
  backupRestoreTested: process.env.BACKUP_RESTORE_TESTED === "true",
  monitoringConfigured: Boolean(process.env.SENTRY_DSN || process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
};
const checks = evaluateLaunchReadiness(loadSecurityEnvironment(), evidence);
const certificate = certifyLaunch(checks);
console.log(JSON.stringify({ checks, certificate }, null, 2));
if (!certificate.certified) process.exitCode = 1;
