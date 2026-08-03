import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PROFESSIONAL_TEMPLATES } from "../src/templates/builtInTemplates";
import { PHASE243D_PREMIUM_TEMPLATES } from "../src/templates/phase243dPremiumTemplates";

test("Phase 24.3D adds eight distinct premium master templates", () => {
  assert.equal(PHASE243D_PREMIUM_TEMPLATES.length, 8);
  assert.equal(ALL_PROFESSIONAL_TEMPLATES.length, 20);
  assert.equal(new Set(PHASE243D_PREMIUM_TEMPLATES.map(t => t.metadata.id)).size, 8);
});

test("Phase 24.3D covers new professional industries and multipage documents", () => {
  const categories = new Set(PHASE243D_PREMIUM_TEMPLATES.map(t => t.metadata.category));
  for (const category of ["Real Estate", "Church", "Healthcare", "Education", "Events", "Restaurant", "Fashion", "Technology"]) assert.ok(categories.has(category as never));
  assert.ok(PHASE243D_PREMIUM_TEMPLATES.some(t => t.pages.length >= 4));
  for (const template of PHASE243D_PREMIUM_TEMPLATES) {
    assert.equal(template.metadata.version, "24.3D");
    assert.equal(template.metadata.qualityScore, 100);
    assert.ok(template.pages.every(page => page.elements.length >= 5));
  }
});

test("Phase 24.3D templates have globally unique page and element ids", () => {
  const pageIds = new Set<string>();
  const elementIds = new Set<string>();
  for (const template of PHASE243D_PREMIUM_TEMPLATES) for (const page of template.pages) {
    assert.ok(!pageIds.has(page.id)); pageIds.add(page.id);
    for (const element of page.elements) { assert.ok(!elementIds.has(element.id)); elementIds.add(element.id); }
  }
});
