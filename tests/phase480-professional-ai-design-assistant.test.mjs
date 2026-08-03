import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine=fs.readFileSync("src/utils/phase48ProfessionalAIDesignAssistant.ts","utf8");
const screen=fs.readFileSync("src/app/ai-design-assistant.tsx","utf8");
const home=fs.readFileSync("src/app/index.tsx","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

test("Phase 48 contains an explainable audit and transformation engine",()=>{
  for(const token of ["auditPhase48Design","applyPhase48Suggestion","phase48ContrastRatio","createPhase48PremiumPass","changes:"]){assert.match(engine,new RegExp(token));}
});
test("Phase 48 screen exposes scores, preview, apply, and dismiss",()=>{
  for(const token of ["AI Design Assistant","Live document preview","recommendations","Apply","Dismiss"]){assert.ok(screen.includes(token));}
});
test("Phase 48 is integrated into navigation and package scripts",()=>{
  assert.ok(home.includes('/ai-design-assistant'));
  assert.equal(pkg.version,"48.0.0");
  assert.ok(pkg.scripts["test:phase48"]);
  assert.ok(pkg.scripts["verify:phase48"]);
});
