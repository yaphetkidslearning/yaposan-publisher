import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 51 files exist", () => {
  assert.ok(fs.existsSync("src/utils/phase51PluginPlatformEngine.ts"));
  assert.ok(fs.existsSync("src/app/developer-platform.tsx"));
});

test("Phase 51 registry includes all planned systems", () => {
  const source = fs.readFileSync("src/utils/phase51PluginPlatformEngine.ts", "utf8");
  assert.match(source, /Typed Plugin SDK/);
  assert.match(source, /Signed Plugin Distribution/);
});

test("Phase 51 navigation is integrated", () => {
  const source = fs.readFileSync("src/app/index.tsx", "utf8");
  assert.match(source, /Developer Platform/);
  assert.ok(source.includes("/developer-platform"));
});
