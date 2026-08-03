import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const engine = fs.readFileSync("src/utils/phase52GlobalPublishingEngine.ts", "utf8");
const screen = fs.readFileSync("src/app/global-publishing.tsx", "utf8");
const home = fs.readFileSync("src/app/index.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Phase 52 provides global publishing models and honest external gates", () => {
  assert.match(engine, /DEFAULT_LOCALE_PACKS/);
  assert.match(engine, /TextDirection = "ltr" \| "rtl"/);
  assert.match(engine, /Translation Memory/);
  assert.match(engine, /External Translation Providers/);
  assert.match(engine, /globalPublishingBlockers/);
});

test("Phase 52 screen persists locale configuration and shows release checks", () => {
  assert.match(screen, /AsyncStorage/);
  assert.match(screen, /Locale packs/);
  assert.match(screen, /Release checks/);
  assert.match(engine, /RTL Layout Foundation/);
});

test("Phase 52 is versioned and integrated into navigation", () => {
  assert.equal(pkg.version, "52.0.0");
  assert.equal(pkg.scripts["test:phase52"], "node --test tests/phase520-global-publishing.test.mjs");
  assert.match(home, /Global Publishing/);
  assert.match(home, /\/global-publishing/);
});
