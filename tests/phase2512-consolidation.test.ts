import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PROFESSIONAL_TEMPLATES } from "../src/templates/builtInTemplates";
import { REAL_PROFESSIONAL_TEMPLATES } from "../src/templates/realProfessionalTemplates";
import { PHASE243D_PREMIUM_TEMPLATES } from "../src/templates/phase243dPremiumTemplates";

test("Phase 25.12 consolidates both professional template branches", () => {
  assert.equal(ALL_PROFESSIONAL_TEMPLATES.length, REAL_PROFESSIONAL_TEMPLATES.length + PHASE243D_PREMIUM_TEMPLATES.length);
  assert.ok(REAL_PROFESSIONAL_TEMPLATES.length >= 12);
  assert.ok(PHASE243D_PREMIUM_TEMPLATES.length >= 8);
});

test("consolidated live templates have unique ids and real editable pages", () => {
  const ids = ALL_PROFESSIONAL_TEMPLATES.map(template => template.metadata.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const template of ALL_PROFESSIONAL_TEMPLATES) {
    assert.ok(template.pages.length > 0, `${template.metadata.name} must contain pages`);
    assert.ok(template.pages.some(page => page.elements.length >= 3), `${template.metadata.name} must contain editable design elements`);
  }
});

test("core professional templates do not use people photos", () => {
  const serialized = JSON.stringify(REAL_PROFESSIONAL_TEMPLATES).toLowerCase();
  for (const forbidden of ["headshot", "portrait photo", "person photo", "team photo", "student photo"]) {
    assert.equal(serialized.includes(forbidden), false, `unexpected people-photo placeholder: ${forbidden}`);
  }
});
