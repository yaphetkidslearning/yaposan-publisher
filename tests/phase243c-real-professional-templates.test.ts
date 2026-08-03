import assert from "node:assert/strict";
import test from "node:test";
import { ALL_PROFESSIONAL_TEMPLATES, LEGACY_GENERATED_TEMPLATES, REAL_PROFESSIONAL_TEMPLATES } from "../src/templates/builtInTemplates";

test("Phase 24.3C live library uses handcrafted templates instead of generated numbered variants", () => {
  assert.equal(ALL_PROFESSIONAL_TEMPLATES, REAL_PROFESSIONAL_TEMPLATES);
  assert.equal(ALL_PROFESSIONAL_TEMPLATES.length, 12);
  assert.ok(LEGACY_GENERATED_TEMPLATES.length > ALL_PROFESSIONAL_TEMPLATES.length);
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.every(template => template.metadata.version === "24.3C"));
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.every(template => template.metadata.qualityScore === 100));
});

test("every curated template has a distinct structural signature", () => {
  const signatures = ALL_PROFESSIONAL_TEMPLATES.map(template => template.pages.map(page =>
    page.elements.map(element => `${element.type}:${Math.round(element.x/25)}:${Math.round(element.y/25)}:${Math.round(element.width/25)}:${Math.round(element.height/25)}`).join("|")
  ).join("//"));
  assert.equal(new Set(signatures).size, signatures.length);
});

test("preview and editor share the exact page and element data", () => {
  for (const template of ALL_PROFESSIONAL_TEMPLATES) {
    assert.ok(template.pages.length >= 1);
    assert.ok(template.pages.every(page => page.elements.length >= 8));
    assert.ok(template.pages.some(page => page.elements.some(element => element.type === "text")));
    assert.ok(template.metadata.tags.includes("exact-preview"));
  }
});
