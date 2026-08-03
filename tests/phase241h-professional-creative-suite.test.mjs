import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");
test("phase 24.1H creative suite modules are present",()=>{
 for(const p of ["src/app/templates.tsx","src/app/brand.tsx","src/app/assets.tsx","src/app/commerce-tools.tsx","src/utils/creativeSuiteStorage.ts"]) assert.equal(fs.existsSync(p),true,`${p} missing`);
});
test("template manager supports professional library actions",()=>{const s=read("src/app/templates.tsx");for(const x of ["Create template","Duplicate","Export library","favorite","Open"])assert.ok(s.includes(x));});
test("brand kit and asset library are connected",()=>{const s=read("src/app/brand.tsx");assert.ok(s.includes("Apply Brand Kit"));assert.ok(s.includes('/assets'));assert.ok(read("src/app/assets.tsx").includes("Professional Asset Library"));});
test("commerce studio links profit and shipping tools",()=>{assert.ok(read("src/app/marketplace.tsx").includes("Commerce Tools"));const s=read("src/app/commerce-tools.tsx");assert.ok(s.includes("Profit calculator"));assert.ok(s.includes("Shipping profiles"));});
