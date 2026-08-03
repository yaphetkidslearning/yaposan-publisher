import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { certifyFinalRelease, verifyFinalReleaseCertification } from "../server/finalRelease.ts";

const complete = {
  sourceVersion: "1.0.0",
  testsPassed: 91,
  testsFailed: 0,
  typecheckPassed: true,
  webBuildPassed: true,
  productionConfigPassed: true,
  securityReviewPassed: true,
  backupRestoreDrillPassed: true,
  desktopArtifactsCertified: true,
  gitCommitSha: "abcdef1234567890",
  buildId: "release-100",
};

test("final certification accepts complete release evidence", () => {
  const result = certifyFinalRelease(complete, new Date("2026-08-03T16:00:00Z"));
  assert.equal(result.sourceReleaseReady, true);
  assert.equal(result.hostedProductionReady, true);
  assert.equal(result.blockers.length, 0);
});

test("final certification refuses RC versions", () => {
  const result = certifyFinalRelease({ ...complete, sourceVersion: "1.0.0-rc.11" });
  assert.equal(result.hostedProductionReady, false);
  assert.match(result.blockers.join(" "), /version/i);
});

test("final certification requires zero test failures", () => {
  const result = certifyFinalRelease({ ...complete, testsFailed: 1 });
  assert.equal(result.sourceReleaseReady, false);
});

test("final certification requires build and typecheck evidence", () => {
  const result = certifyFinalRelease({ ...complete, typecheckPassed: false, webBuildPassed: false });
  assert.equal(result.hostedProductionReady, false);
  assert.equal(result.blockers.length >= 2, true);
});

test("source certification remains distinct from hosted deployment certification", () => {
  const result = certifyFinalRelease({ ...complete, webBuildPassed: false, productionConfigPassed: false, backupRestoreDrillPassed: false, desktopArtifactsCertified: false, buildId: undefined });
  assert.equal(result.sourceReleaseReady, true);
  assert.equal(result.hostedProductionReady, false);
});

test("release evidence checksum detects tampering", () => {
  const result = certifyFinalRelease(complete);
  assert.equal(verifyFinalReleaseCertification(result), true);
  assert.equal(verifyFinalReleaseCertification({ ...result, testsPassed: 999 }), false);
});

test("release package version labels are locked", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.version, "1.0.0");
  assert.match(fs.readFileSync("server/index.ts", "utf8"), /releaseVersion = "1\.0\.0"/);
  assert.match(fs.readFileSync("electron-builder.yml", "utf8"), /version: 1\.0\.0/);
});

test("final release documentation contains deployment distinction", () => {
  const text = fs.readFileSync("RC12-FINAL-PRODUCTION-CERTIFICATION-AND-V1.0.0-RELEASE.md", "utf8");
  assert.match(text, /source release/i);
  assert.match(text, /hosted production/i);
  assert.match(text, /not independently validated/i);
});
