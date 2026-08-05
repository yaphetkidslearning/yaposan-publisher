import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePhase88, PHASE88_GATES } from "../server/phase88Readiness.mjs";

test("Phase 88 defines all eight launch-readiness gates", () => assert.equal(PHASE88_GATES.length, 8));

test("Phase 88 does not falsely certify without external evidence", () => {
  const result = evaluatePhase88(process.cwd(), {});
  assert.equal(result.passed, false);
  assert.equal(result.status, "verification-required");
  assert.match(result.digest, /^[a-f0-9]{64}$/);
});

test("Phase 88 certifies only when every external gate is verified", () => {
  const yes = {
    PUBLIC_SITE_URL:"https://yaposan.com", APP_SITE_URL:"https://app.yaposan.com",
    LEGAL_REVIEW_COMPLETE:"true", ACCESSIBILITY_AUDIT_COMPLETE:"true", BROWSER_MATRIX_COMPLETE:"true",
    CI_FULL_VERIFY_COMPLETE:"true", PRODUCTION_ALERTS_VERIFIED:"true", DESKTOP_SIGNING_VERIFIED:"true",
    MOBILE_STORE_BUILDS_VERIFIED:"true"
  };
  assert.equal(evaluatePhase88(process.cwd(), yes).passed, true);
});
