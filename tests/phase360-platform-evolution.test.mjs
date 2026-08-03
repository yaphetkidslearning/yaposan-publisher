import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync(new URL("../src/utils/phase36PlatformEvolutionEngine.ts", import.meta.url), "utf8");
const screen = fs.readFileSync(new URL("../src/app/platform-evolution.tsx", import.meta.url), "utf8");
const home = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");

test("Phase 36 defines packages 36.0 through 36.12", () => {
  for (let i = 0; i <= 12; i += 1) assert.match(engine, new RegExp(`id: \\"36\\.${i}\\"`));
});

test("Phase 36 workspace persists objectives and experiments", () => {
  assert.match(screen, /yaposan\.phase36\.objectives/);
  assert.match(screen, /yaposan\.phase36\.experiments/);
  assert.match(screen, /createExperiment/);
});

test("Phase 36 is connected to home navigation", () => {
  assert.match(home, /Platform Evolution/);
  assert.match(home, /\/platform-evolution/);
});
