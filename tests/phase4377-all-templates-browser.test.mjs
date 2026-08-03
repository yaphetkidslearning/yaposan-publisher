import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../src/app/template-ecosystem.tsx",import.meta.url),"utf8");
test("all templates browser controls are wired",()=>{
  assert.ok(source.includes('All Templates ({allTemplates.length})'));
  assert.ok(source.includes('setViewMode("all")'));
  assert.ok(source.includes('filteredAll.map'));
  assert.ok(source.includes('setFiltersOpen'));
  assert.ok(source.includes('router.push("/ai" as never)'));
});
