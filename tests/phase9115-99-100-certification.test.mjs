import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("Photo Studio has a real export path for edited output",()=>{
  assert.equal(existsSync("src/utils/photoStudioExport.ts"),true);
  const app=read("src/app/photo-studio.tsx"), exp=read("src/utils/photoStudioExport.ts");
  assert.match(app,/label="Export"/); assert.match(app,/exportPhotoStudioAsset/);
  assert.match(exp,/URL\.createObjectURL/); assert.match(exp,/shareAsync/); assert.match(exp,/writeAsStringAsync|downloadAsync/);
});

test("media provider options cannot override the trusted prompt or model",()=>{
  const media=read("server/mediaGeneration.ts");
  assert.match(media,/\{ \.\.\.\(request\.options \?\? \{\}\), prompt: request\.prompt, model:/);
});

test("91.15 final gate covers runtime, providers, persistence, undo, export and security",()=>{
  const pkg=JSON.parse(read("package.json"));
  const verify=pkg.scripts["verify:phase91.15"]||"";
  for(const part of ["typecheck","phase91.14","phase91.15","build:web","check:phase91.15"]) assert.match(verify,new RegExp(part.replace(".","\\.")));
  assert.equal(existsSync("scripts/certify-local-runtime-91.15.mjs"),true);
  assert.equal(existsSync("docs/PHASE91.15-99-100-ACCEPTANCE.md"),true);
});

test("final acceptance explicitly covers every What will you create today route",()=>{
  const doc=read("docs/PHASE91.15-99-100-ACCEPTANCE.md");
  for(const route of ["Design","Image","Video","Website","Presentation","Document","Social","Marketing","Audio","App","Automation"]) assert.match(doc,new RegExp(`\\b${route}\\b`));
});

test("final acceptance includes difficult images and negative provider paths",()=>{
  const doc=read("docs/PHASE91.15-99-100-ACCEPTANCE.md");
  for(const phrase of ["fine hair","glass","white-on-white","dark-on-dark","invalid API key","timeout","quota","offline","Save/reload","Undo/Redo","Export"]) assert.match(doc,new RegExp(phrase,"i"));
});
