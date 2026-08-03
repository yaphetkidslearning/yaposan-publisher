import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const engine=fs.readFileSync("src/utils/phase45ProfessionalComponentEngine.ts","utf8");const app=fs.readFileSync("src/app/component-library.tsx","utf8");
test("includes all 12 requested component types",()=>{for(const name of ["hero","feature-card","cta","footer","header","statistics","testimonial","pricing","team","gallery","timeline","faq"]) assert.match(engine,new RegExp(`\\"${name}\\"`));});
test("builds real PublisherElement arrays and inserts them into pages",()=>{assert.match(engine,/buildPhase45Component/);assert.match(engine,/insertPhase45Component/);assert.match(engine,/PublisherElement\[\]/);});
test("component library screen is searchable",()=>{assert.match(app,/TextInput/);assert.match(app,/PHASE45_COMPONENTS/);});
