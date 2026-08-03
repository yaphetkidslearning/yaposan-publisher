import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_BROWSER_FILTERS, filterProfessionalTemplates, getBrowserFacets } from "../src/templates/professionalTemplateBrowser";
import { ALL_PROFESSIONAL_TEMPLATES } from "../src/templates/templateEngine";

test("Phase 24.3B exposes professional browser facets", () => {
  const facets = getBrowserFacets(ALL_PROFESSIONAL_TEMPLATES);
  assert.equal(facets.subcategories[0], "All");
  assert.ok(facets.subcategories.length > 5);
  assert.equal(facets.industries[0], "All");
});

test("Phase 24.3B filters and sorts templates without mutating the library", () => {
  const originalFirst = ALL_PROFESSIONAL_TEMPLATES[0]?.metadata.id;
  const result = filterProfessionalTemplates(ALL_PROFESSIONAL_TEMPLATES, { ...DEFAULT_BROWSER_FILTERS, query: "business" }, new Set());
  assert.ok(result.length > 0);
  assert.equal(ALL_PROFESSIONAL_TEMPLATES[0]?.metadata.id, originalFirst);
});

test("Phase 24.3B favorites filter returns only saved templates", () => {
  const id = ALL_PROFESSIONAL_TEMPLATES[0]?.metadata.id;
  assert.ok(id);
  const result = filterProfessionalTemplates(ALL_PROFESSIONAL_TEMPLATES, { ...DEFAULT_BROWSER_FILTERS, favoritesOnly: true }, new Set([id]));
  assert.equal(result.length, 1);
  assert.equal(result[0]?.metadata.id, id);
});
