import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePhase89, PHASE89_GATES } from "../server/phase89LaunchVerification.mjs";

test("Phase 89 defines thirteen launch gates", () => assert.equal(PHASE89_GATES.length, 13));

test("Phase 89 fails safely without production evidence", () => {
  const result = evaluatePhase89(process.cwd(), {});
  assert.equal(result.status, "fail");
  assert.equal(result.passedCount, 0);
  assert.match(result.digest, /^[a-f0-9]{64}$/);
});

test("Phase 89 passes only when all launch gates are verified", () => {
  const env = Object.fromEntries([
    "AUTH_E2E", "AUTHZ_ISOLATION", "ENVIRONMENT", "MIGRATIONS", "BACKUP_RESTORE",
    "SECURITY", "EXPORT", "BILLING", "AI_SAFETY", "PERFORMANCE", "ACCESSIBILITY",
    "BROWSER_MATRIX", "INCIDENT_READINESS"
  ].map(name => [`PHASE89_${name}_VERIFIED`, "true"]));
  const result = evaluatePhase89(process.cwd(), env);
  assert.equal(result.status, "pass");
  assert.equal(result.passedCount, 13);
});
