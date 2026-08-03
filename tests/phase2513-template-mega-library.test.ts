import test from "node:test";
import assert from "node:assert/strict";
import { PHASE2513_CATEGORY_GROUPS, PHASE2513_SUBCATEGORY_COUNT, PHASE2513_TEMPLATE_COUNT, PHASE2513_TEMPLATES } from "../src/templates/phase2513TemplateMegaLibrary";

test("Phase 25.13 includes every requested category and subcategory", () => {
  assert.equal(PHASE2513_CATEGORY_GROUPS.length, 5);
  assert.equal(PHASE2513_SUBCATEGORY_COUNT, 39);
  assert.equal(PHASE2513_TEMPLATE_COUNT, 117);
  const subcategories = new Set(PHASE2513_TEMPLATES.map(template => template.metadata.subcategory));
  for (const group of PHASE2513_CATEGORY_GROUPS) for (const item of group.items) assert.ok(subcategories.has(item), `Missing ${item}`);
});

test("Phase 25.13 templates are editable and contain no person photography", () => {
  for (const template of PHASE2513_TEMPLATES) {
    assert.equal(template.metadata.editable, true);
    assert.match(template.metadata.description, /No person photography/i);
    assert.ok(template.pages.length >= 1);
    assert.ok(template.pages.every(page => page.elements.length >= 9));
    assert.ok(template.pages.flatMap(page => page.elements).every(element => !element.imageUri));
  }
});
