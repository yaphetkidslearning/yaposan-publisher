import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("Phase 86 release files are present", () => {
  for (const file of [
    "server/phase86ReleaseCertification.ts",
    "scripts/phase86-release-preflight.mjs",
    "PHASE86-FINAL-PRODUCTION-RELEASE-AND-CERTIFICATION.md",
    "RELEASE-CHECKLIST-v1.0.0.md",
  ]) assert.equal(fs.existsSync(path.join(root, file)), true, file);
});

test("package version is locked to 1.0.0", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.version, "1.0.0");
  assert.equal(typeof pkg.scripts["test:phase86"], "string");
  assert.equal(typeof pkg.scripts["release:phase86:preflight"], "string");
});

test("release checklist does not claim unsigned artifacts are complete", () => {
  const checklist = fs.readFileSync(path.join(root, "RELEASE-CHECKLIST-v1.0.0.md"), "utf8");
  assert.match(checklist, /Windows code-signing certificate required/i);
  assert.match(checklist, /Apple Developer credentials required/i);
  assert.match(checklist, /Google Play signing credentials required/i);
});
