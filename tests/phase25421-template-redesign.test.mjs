import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 25.42.1 redesign is wired into every active template", () => {
  const builtIns = fs.readFileSync("src/templates/builtInTemplates.ts", "utf8");
  const engine = fs.readFileSync("src/templates/phase25421CanvaQualityRedesign.ts", "utf8");
  assert.match(builtIns, /redesignAllTemplatesForPhase25421/);
  assert.match(engine, /version: "25\.42\.1"/);
  assert.match(engine, /templates\.map\(redesignTemplateForPhase25421\)/);
  assert.match(engine, /fillGradient/);
  assert.match(engine, /qualityScore: Math\.max/);
});
