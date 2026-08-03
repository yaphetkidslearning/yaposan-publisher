import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PROFESSIONAL_TEMPLATES, PHASE2540_MARKETPLACE_AUDIT } from "../src/templates/builtInTemplates";

test("Phase 25.40 prepares the full active library for the marketplace", () => {
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.length > 0);
  assert.equal(PHASE2540_MARKETPLACE_AUDIT.total, ALL_PROFESSIONAL_TEMPLATES.length);
  assert.ok(PHASE2540_MARKETPLACE_AUDIT.featured > 0);
  assert.ok(PHASE2540_MARKETPLACE_AUDIT.trending > 0);
  assert.ok(PHASE2540_MARKETPLACE_AUDIT.free > 0);
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.every(t => t.metadata.version === "25.40"));
  assert.ok(ALL_PROFESSIONAL_TEMPLATES.every(t => (t.metadata.qualityScore ?? 0) >= 94));
});
