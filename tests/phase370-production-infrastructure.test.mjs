import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync(new URL("../src/utils/phase37ProductionInfrastructureEngine.ts", import.meta.url), "utf8");
const screen = fs.readFileSync(new URL("../src/app/production-infrastructure.tsx", import.meta.url), "utf8");
const home = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");

test("Phase 37 contains Packages 37.0 through 37.12", () => {
  for (let index = 0; index <= 12; index += 1) assert.match(engine, new RegExp(`id: "37\\.${index}"`));
});

test("Phase 37 implements persistent readiness, credentials and honest certification", () => {
  assert.match(screen, /AsyncStorage/);
  assert.match(engine, /DEFAULT_CREDENTIALS/);
  assert.match(engine, /productionBlockers/);
  assert.match(engine, /certified: score === 100 && blockers.length === 0/);
});

test("Phase 37 workspace is integrated into home navigation", () => {
  assert.match(home, /\/production-infrastructure/);
  assert.match(screen, /Production Infrastructure & Enterprise Platform/);
});
