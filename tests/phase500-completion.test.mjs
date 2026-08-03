import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 50 files exist", () => {
  assert.ok(fs.existsSync("src/utils/phase50ReleaseCenterEngine.ts"));
  assert.ok(fs.existsSync("src/app/release-center.tsx"));
});

test("Phase 50 registry includes all planned systems", () => {
  const source = fs.readFileSync("src/utils/phase50ReleaseCenterEngine.ts", "utf8");
  assert.match(source, /Release Readiness/);
  assert.match(source, /External Dependency Gates/);
});

test("Phase 50 navigation is integrated", () => {
  const source = fs.readFileSync("src/app/index.tsx", "utf8");
  assert.match(source, /Release Center/);
  assert.ok(source.includes("/release-center"));
});
