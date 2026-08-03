import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync(new URL("../src/utils/phase35LaunchReadinessEngine.ts", import.meta.url), "utf8");
const screen = fs.readFileSync(new URL("../src/app/launch-readiness.tsx", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");

test("Phase 35 defines all thirteen packages", () => {
  for (let i = 0; i <= 12; i += 1) assert.match(engine, new RegExp(`id: \\\"35\\.${i}\\\"`));
});

test("Phase 35 includes readiness, incidents and environment validation", () => {
  assert.match(engine, /readinessScore/);
  assert.match(engine, /createIncident/);
  assert.match(engine, /validateEnvironment/);
  assert.match(screen, /Readiness Matrix/);
});

test("Phase 35 workspace is connected to home navigation", () => {
  assert.match(index, /launch-readiness/);
  assert.match(index, /Launch Readiness/);
});
