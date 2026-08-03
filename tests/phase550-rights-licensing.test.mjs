import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync("src/utils/phase55RightsLicensingEngine.ts", "utf8");
const screen = fs.readFileSync("src/app/rights-licensing.tsx", "utf8");
const home = fs.readFileSync("src/app/index.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Phase 55 defines rights, license, usage, and compliance models", () => {
  for (const token of ["LicensedAsset", "UsageRequest", "RightsRule", "canUseAsset", "rightsComplianceScore", "rightsBlockers"]) assert.match(engine, new RegExp(token));
});

test("Phase 55 provides a persistent Rights & Licensing dashboard", () => {
  assert.match(screen, /AsyncStorage/);
  assert.match(screen, /Licensed asset registry/);
  assert.match(screen, /Usage clearance queue/);
  assert.match(screen, /Publishing blockers/);
});

test("Phase 55 is integrated into navigation and package metadata", () => {
  assert.match(home, /Rights & Licensing/);
  assert.match(home, /\/rights-licensing/);
  assert.equal(pkg.version, "55.0.0");
  assert.ok(pkg.scripts["test:phase55"]);
});
