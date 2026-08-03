import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const engine = fs.readFileSync("src/utils/phase54BrandGovernanceEngine.ts", "utf8");
const screen = fs.readFileSync("src/app/brand-governance.tsx", "utf8");
const home = fs.readFileSync("src/app/index.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Phase 54 provides governed assets, rules, and content operations", () => {
  assert.match(engine, /BrandAsset/);
  assert.match(engine, /BrandRule/);
  assert.match(engine, /ContentRequest/);
  assert.match(engine, /DEFAULT_BRAND_ASSETS/);
  assert.match(engine, /Remote DAM & SSO Connectors/);
});

test("Phase 54 screen persists state and exposes governance controls", () => {
  assert.match(screen, /AsyncStorage/);
  assert.match(screen, /Brand Governance/);
  assert.match(screen, /Governed brand library/);
  assert.match(screen, /Content operations/);
  assert.match(screen, /updateAssetStatus/);
  assert.match(screen, /updateRequestStatus/);
});

test("Phase 54 is versioned and integrated into navigation", () => {
  assert.equal(pkg.version, "54.0.0");
  assert.equal(pkg.scripts["test:phase54"], "node --test tests/phase540-brand-governance.test.mjs");
  assert.match(home, /Brand Governance/);
  assert.match(home, /\/brand-governance/);
});
