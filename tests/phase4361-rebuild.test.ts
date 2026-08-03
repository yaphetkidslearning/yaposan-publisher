import test from "node:test";
import assert from "node:assert/strict";
import { PHASE43_CATEGORIES, PHASE43_TEMPLATES } from "../src/templates/phase43ProfessionalTemplateEcosystem";
import { auditPhase4361Library } from "../src/templates/phase4361TemplateQualityAudit";
import fs from "node:fs";

test("quality-first library keeps five art-directed templates in every category", () => {
  assert.equal(PHASE43_CATEGORIES.length, 32);
  assert.ok(PHASE43_CATEGORIES.every((category) => category.templates.length === 5));
  assert.equal(PHASE43_TEMPLATES.length, 160);
});

test("every Phase 43.6.1 template passes evidence-based quality audit", () => {
  const result = auditPhase4361Library(PHASE43_TEMPLATES);
  assert.equal(result.passed, result.total);
  assert.ok(result.averageScore >= 88);
});

test("home sidebar is consolidated into ten expandable primary sections", () => {
  const source = fs.readFileSync("src/app/index.tsx", "utf8");
  for (const label of ["Home","Publisher","Creative Studios","Web & Documents","3D & Mockups","Yaposan AI","Templates & Marketing","Team & Automation","Enterprise & Release","Platform & Support"]) assert.match(source, new RegExp(label.replace(/[&]/g, "\\&")));
  assert.match(source, /SidebarAccordion/);
});
