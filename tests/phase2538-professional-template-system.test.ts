import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PROFESSIONAL_TEMPLATES, PHASE2538_TEMPLATE_AUDIT } from "../src/templates/builtInTemplates";

test("Phase 25.38 professionalizes every active template", () => {
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.length > 100);
  assert.equal(PHASE2538_TEMPLATE_AUDIT.professionalizedTemplates, ALL_PROFESSIONAL_TEMPLATES.length);
  assert.ok(PHASE2538_TEMPLATE_AUDIT.averageQualityScore >= 92);

  for (const template of ALL_PROFESSIONAL_TEMPLATES) {
    assert.equal(template.metadata.version, "25.38");
    assert.ok((template.metadata.fonts?.length ?? 0) >= 2);
    assert.ok((template.metadata.palette?.length ?? 0) >= 3);
    assert.ok((template.metadata.qualityScore ?? 0) >= 92);
    assert.ok(template.metadata.tags.includes("professional"));
  }
});
