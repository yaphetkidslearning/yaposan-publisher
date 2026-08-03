import assert from "node:assert/strict";
import test from "node:test";
import { PHASE2529_COUNTS_BY_SUBCATEGORY, PHASE2529_SUBCATEGORY_COUNT, PHASE2529_TEMPLATE_COUNT, PHASE2529_TEMPLATES } from "../src/templates/phase2529CategoryCompletionLibrary";

test("Phase 25.29 adds 20 templates to all 39 sidebar subcategories", () => {
  assert.equal(PHASE2529_SUBCATEGORY_COUNT, 39);
  assert.equal(PHASE2529_TEMPLATE_COUNT, 780);
  assert.equal(PHASE2529_TEMPLATES.length, 780);
  for (const count of Object.values(PHASE2529_COUNTS_BY_SUBCATEGORY)) assert.equal(count, 20);
});

test("Phase 25.29 template identifiers are unique and editable", () => {
  const ids = PHASE2529_TEMPLATES.map(template => template.metadata.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(PHASE2529_TEMPLATES.every(template => template.metadata.editable && template.pages.length > 0));
});
