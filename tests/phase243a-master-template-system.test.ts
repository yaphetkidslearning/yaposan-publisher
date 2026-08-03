import assert from "node:assert/strict";
import test from "node:test";
import { auditMasterTemplate, compileMasterTemplate, createMasterVariant, type MasterTemplateDefinition } from "../src/templates/masterTemplateSystem";

const master: MasterTemplateDefinition = {
  id: "phase243a-test-master", name: "Executive Editorial Card", kind: "business-card", category: "Business", subcategory: "Business Cards",
  industry: "Consulting", style: "editorial", pageSize: "3.5 x 2 in", orientation: "landscape", width: 1050, height: 600,
  description: "A handcrafted editorial business card master.", tags: ["executive", "editorial", "consulting", "premium"],
  palette: { background: "#F8F4EC", surface: "#FFFFFF", primary: "#172033", accent: "#C89545", text: "#111827", muted: "#667085" },
  fonts: { heading: "Playfair Display", body: "Inter" },
  pages: [{ name: "Front", elements: [{ id: "name", name: "Name", type: "text", x: 70, y: 170, width: 600, height: 100, rotation: 0, zIndex: 1, opacity: 1, text: "{{PersonName}}" }] }],
};

test("master templates compile without losing their exact page structure", () => {
  const result = compileMasterTemplate(master);
  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0].elements[0].x, 70);
  assert.equal(result.metadata.masterTemplateId, master.id);
  assert.equal(result.metadata.version, "24.3A");
});

test("curated variants keep structure but receive unique IDs", () => {
  const variant = createMasterVariant(master, { id: "phase243a-healthcare", name: "Healthcare Editorial Card", industry: "Healthcare" });
  assert.equal(variant.industry, "Healthcare");
  assert.notEqual(variant.pages[0].elements[0].id, master.pages[0].elements[0].id);
  assert.equal(auditMasterTemplate(variant).errors.length, 0);
});
