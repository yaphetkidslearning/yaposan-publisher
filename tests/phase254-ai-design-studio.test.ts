import assert from "node:assert/strict";
import test from "node:test";
import { auditDesign, buildImageGenerationRequest, generateBrandDirections, generateLayoutConcepts, suggestContent, DEFAULT_BRAND_PROFILE } from "../src/utils/professionalAiDesignStudioEngine";

test("Phase 25.4 generates multiple professional layout directions", () => {
  const layouts = generateLayoutConcepts({ documentType:"brochure", audience:"designers", objective:"launch", pageCount:6, style:"editorial", requiredSections:["Cover","Features","CTA"] });
  assert.equal(layouts.length, 3); assert.ok(layouts.every(x => x.score >= 70 && x.columns > 0));
});
test("Phase 25.4 produces branding and content suggestions", () => {
  assert.equal(generateBrandDirections("Yaposan", ["creative"], "professional").length, 3);
  assert.ok(suggestContent("Publishing platform", "creators", "start a project").some(x => x.kind === "cta"));
});
test("Phase 25.4 keeps image generation provider-ready", () => {
  const req = buildImageGenerationRequest("A modern studio", DEFAULT_BRAND_PROFILE, "landscape"); assert.equal(req.providerRequired, true); assert.equal(req.width, 1536);
});
test("Phase 25.4 audits production design quality", () => {
  const report = auditDesign({ contrastRatio:3, fontCount:6, alignmentConsistency:60, overflowCount:2, imageResolutionWarnings:1, hasBrandProfile:false });
  assert.ok(report.score < 70); assert.ok(report.issues.some(x => x.severity === "error"));
});
