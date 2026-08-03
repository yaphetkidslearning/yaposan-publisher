import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync(new URL("../src/utils/phase38GlobalCommercialReleaseEngine.ts", import.meta.url), "utf8");
const screen = fs.readFileSync(new URL("../src/app/global-commercial-release.tsx", import.meta.url), "utf8");
const home = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");

test("Phase 38 contains Packages 38.0 through 38.12", () => {
  for (let index = 0; index <= 12; index += 1) assert.match(engine, new RegExp(`id: "38\\.${index}"`));
});

test("Phase 38 includes commercial checks, connectors, release artifacts and evidence-based certification", () => {
  assert.match(engine, /DEFAULT_COMMERCIAL_CHECKS/);
  assert.match(engine, /DEFAULT_COMMERCIAL_CONNECTORS/);
  assert.match(engine, /DEFAULT_RELEASE_ARTIFACTS/);
  assert.match(engine, /certified: score === 100 && blockers.length === 0/);
  assert.match(screen, /AsyncStorage/);
});

test("Phase 38 workspace is integrated into home navigation", () => {
  assert.match(home, /\/global-commercial-release/);
  assert.match(screen, /Global Commercial Platform & Yaposan 1.0 Release/);
});
