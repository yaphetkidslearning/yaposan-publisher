import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const PHASE88_GATES = [
  "public_app_domain_separation",
  "legal_policy_review",
  "wcag_2_2_aa_audit",
  "cross_browser_device_matrix",
  "ci_build_integration_tests",
  "production_observability_alerts",
  "signed_desktop_installers",
  "signed_mobile_store_builds",
];

export function evaluatePhase88(root = process.cwd(), env = process.env) {
  const evidence = {
    publicAppSeparation: Boolean(env.PUBLIC_SITE_URL && env.APP_SITE_URL && env.PUBLIC_SITE_URL !== env.APP_SITE_URL),
    legalReviewed: env.LEGAL_REVIEW_COMPLETE === "true",
    accessibilityAudited: env.ACCESSIBILITY_AUDIT_COMPLETE === "true",
    browserMatrixComplete: env.BROWSER_MATRIX_COMPLETE === "true",
    ciVerified: env.CI_FULL_VERIFY_COMPLETE === "true",
    alertsVerified: env.PRODUCTION_ALERTS_VERIFIED === "true",
    desktopSigned: env.DESKTOP_SIGNING_VERIFIED === "true",
    mobileSigned: env.MOBILE_STORE_BUILDS_VERIFIED === "true",
  };
  const files = ["src/utils/siteSeparation.ts", "src/app/public-site.tsx", "src/app/accessibility.tsx"];
  const sourceFilesPresent = files.every(file => fs.existsSync(path.join(root, file)));
  const passed = sourceFilesPresent && Object.values(evidence).every(Boolean);
  const digest = crypto.createHash("sha256").update(JSON.stringify({ evidence, sourceFilesPresent })).digest("hex");
  return { passed, sourceFilesPresent, evidence, digest, status: passed ? "certified" : "verification-required" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  console.log(JSON.stringify(evaluatePhase88(), null, 2));
}
