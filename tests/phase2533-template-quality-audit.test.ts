import assert from "node:assert/strict";
import test from "node:test";
import { auditTemplateLibrary, auditTemplateQuality } from "../src/templates/templateQualityAudit";
import type { ProfessionalTemplate } from "../src/templates/types";

const template: ProfessionalTemplate = {
  metadata: {
    id: "phase2533-quality-test",
    name: "Professional Quality Test",
    category: "Business",
    subcategory: "Reports",
    industry: "Professional Services",
    description: "A structured and editable business report.",
    tags: ["report", "business", "professional"],
    pageSize: "US Letter",
    orientation: "portrait",
    previewColor: "#0F172A",
    author: "Yaposan",
    version: "25.33.0",
    editable: true,
    createdAt: "2026-07-29T00:00:00.000Z",
    updatedAt: "2026-07-29T00:00:00.000Z",
  },
  pages: [{
    id: "page-1",
    name: "Report",
    width: 816,
    height: 1056,
    backgroundColor: "#FFFFFF",
    elements: [
      { id: "heading", type: "text", x: 72, y: 72, width: 672, height: 80, text: "Executive Report", fontSize: 36, color: "#0F172A" },
      { id: "accent", type: "shape", x: 72, y: 176, width: 180, height: 12, fill: "#2563EB", shapeType: "rectangle" },
    ],
  }],
};

test("Phase 25.33 quality audit produces a scored report", () => {
  const report = auditTemplateQuality(template);
  assert.equal(report.templateId, template.metadata.id);
  assert.ok(report.score >= 80);
  assert.equal(report.passed, true);
});

test("Phase 25.33 library audit summarizes results", () => {
  const summary = auditTemplateLibrary([template]);
  assert.equal(summary.total, 1);
  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 0);
});
