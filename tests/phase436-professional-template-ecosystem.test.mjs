import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const engine=fs.readFileSync("src/templates/phase43ProfessionalTemplateEcosystem.ts","utf8");const page=fs.readFileSync("src/app/template-ecosystem.tsx","utf8");const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
test("Phase 43.0-43.6 includes 32 professional categories",()=>{assert.match(engine,/Business Flyers/);assert.match(engine,/Stickers \/ Badges/);assert.match(engine,/PHASE43_CATEGORIES/)});
test("Phase 43 includes 384 editable templates and working create flow",()=>{assert.match(engine,/length:12/);assert.match(page,/templateToProject/);assert.match(page,/savePublisherProject/)});
test("Phase 43 route and scripts are integrated",()=>{assert.equal(pkg.version,"43.6.0");assert.ok(pkg.scripts["verify:phase43.6"]);assert.match(fs.readFileSync("src/app/templates.tsx","utf8"),/template-ecosystem/)});
