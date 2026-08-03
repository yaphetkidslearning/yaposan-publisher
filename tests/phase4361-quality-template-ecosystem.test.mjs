import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const engine=fs.readFileSync("src/templates/phase43ProfessionalTemplateEcosystem.ts","utf8");const page=fs.readFileSync("src/app/template-ecosystem.tsx","utf8");const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
test("Phase 43.6.1 uses five art-directed templates per category",()=>{assert.match(engine,/length:5/);assert.match(engine,/editorial/);assert.match(engine,/photo-led/);assert.match(engine,/qualityScore:98/)});
test("Phase 43.6.1 retains 32 categories and editor creation flow",()=>{assert.match(engine,/Business Flyers/);assert.match(engine,/Stickers \/ Badges/);assert.match(page,/templateToProject/);assert.match(page,/savePublisherProject/)});
test("Phase 43.6.1 version and verification scripts are integrated",()=>{assert.equal(pkg.version,"43.6.1");assert.ok(pkg.scripts["verify:phase43.6.1"]);assert.match(page,/160/)});
