import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync("src/utils/phase47ProfessionalAssetMarketplace.ts","utf8");
const screen = fs.readFileSync("src/app/asset-marketplace.tsx","utf8");
const home = fs.readFileSync("src/app/index.tsx","utf8");
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));

test("Phase 47 includes all ten professional asset types", () => {
  for (const type of ["icon","illustration","photo","video","audio","font","frame","background","sticker","mockup"]) assert.match(engine,new RegExp(`\\"${type}\\"`));
  assert.match(engine,/searchPhase47Assets/);
  assert.match(engine,/togglePhase47Favorite/);
  assert.match(engine,/submitPhase47CreatorAsset/);
});

test("Asset Marketplace screen includes search, filters, favorites, licensing, and cards", () => {
  assert.match(screen,/Professional Asset Marketplace/);
  assert.match(screen,/Search assets/);
  assert.match(screen,/Pro only/);
  assert.match(screen,/favorites/);
  assert.match(screen,/license/);
});

test("Phase 47 is integrated into navigation and package scripts", () => {
  assert.match(home,/\/asset-marketplace/);
  assert.equal(pkg.version,"47.0.0");
  assert.ok(pkg.scripts["test:phase47"]);
  assert.ok(pkg.scripts["verify:phase47"]);
});
