import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("complete source tree exists in delivered package",()=>{
  for(const f of ["package.json","package-lock.json","src/app/_layout.tsx","src/app/+html.tsx","server/database.ts","scripts/create-source-release.mjs","tests/phase9018-source-package-integrity.test.mjs"]) assert.equal(existsSync(f),true,`missing ${f}`);
});

test("Phase 90.18 packager guards against the incomplete 90.17 archive regression",()=>{
  const s=read("scripts/create-source-release.mjs");
  for(const f of ["package.json","src/app/_layout.tsx","server/database.ts","tests/phase9018-source-package-integrity.test.mjs"]) assert.ok(s.includes(`\"${f}\"`),`packager required list missing ${f}`);
});

test("Phase 90.18 keeps external production certification honest",()=>{
  const e=JSON.parse(read("release/phase90.18/release-finalization-evidence.json")); assert.ok(Object.values(e.externalProductionEvidence).every(v=>v===false));
});

test("top-level tests and final verifier include 90.18 and prior production protections",()=>{
  const pkg=JSON.parse(read("package.json")); assert.match(pkg.scripts.test,/test:phase90\.18/); const v=pkg.scripts["verify:phase90.18"];
  for(const token of ["npm test","build:web","check:phase90.14","check:phase90.15","check:phase90.16","check:phase90.17","check:phase90.18"]) assert.ok(v.includes(token),`verify:phase90.18 missing ${token}`);
});
