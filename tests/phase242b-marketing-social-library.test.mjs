import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lib = fs.readFileSync(new URL("../src/templates/marketingSocialLibrary.ts", import.meta.url), "utf8");
const builtIn = fs.readFileSync(new URL("../src/templates/builtInTemplates.ts", import.meta.url), "utf8");
const tools = fs.readFileSync(new URL("../src/templates/marketingCampaignTools.ts", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 24.2B defines exactly 800 marketing and social templates", () => {
  const counts = [...lib.matchAll(/count:\s*(\d+)/g)].map((m) => Number(m[1]));
  assert.equal(counts.reduce((a, b) => a + b, 0), 800);
});

test("all eight requested collections exist", () => {
  for (const name of ["Social Media", "Marketing", "Posters", "Brochures", "Banners", "Catalogs", "Email Marketing", "Digital Ads"]) assert.match(lib, new RegExp(name));
});

test("built-in registry includes Phase 24.2B templates", () => {
  assert.match(builtIn, /MARKETING_SOCIAL_TEMPLATES/);
  assert.match(builtIn, /registerMany\(\[\.\.\.BUSINESS_CARD_TEMPLATES, \.\.\.BUSINESS_DOCUMENT_TEMPLATES, \.\.\.MARKETING_SOCIAL_TEMPLATES\]\)/);
});

test("campaign tools provide presets and bundle generation", () => {
  assert.match(tools, /SOCIAL_PLATFORM_PRESETS/);
  assert.match(tools, /createCampaignBundle/);
  assert.match(tools, /recommendMarketingTemplates/);
});

test("package is versioned and exposes verification scripts", () => {
  assert.equal(pkg.version, "24.2.5");
  assert.ok(pkg.scripts["test:phase24.2b"]);
  assert.ok(pkg.scripts["verify:phase24.2b"]);
});
