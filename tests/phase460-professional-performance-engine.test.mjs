import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), "utf8");

test("Phase 46 performance engine includes core runtime systems", () => {
  const source = read("src/utils/phase46ProfessionalPerformanceEngine.ts");
  for (const token of ["Phase46LRUCache", "Phase46TaskScheduler", "Phase46UndoHistory", "getPhase46VirtualWindow", "PHASE46_PERFORMANCE_BUDGETS", "phase46PerformanceScore"]) assert.match(source, new RegExp(token));
});

test("Phase 46 includes an honest performance center", () => {
  const screen = read("src/app/performance-center.tsx");
  assert.match(screen, /Professional Performance Engine/);
  assert.match(screen, /does not claim GPU acceleration or production deployment/);
  assert.match(screen, /Run diagnostic/);
});

test("Phase 46 is integrated into navigation and package scripts", () => {
  const home = read("src/app/index.tsx");
  const pkg = JSON.parse(read("package.json"));
  assert.match(home, /Performance Center/);
  assert.match(home, /\/performance-center/);
  assert.equal(pkg.version, "46.0.0");
  assert.ok(pkg.scripts["test:phase46"]);
  assert.ok(pkg.scripts["verify:phase46"]);
});
