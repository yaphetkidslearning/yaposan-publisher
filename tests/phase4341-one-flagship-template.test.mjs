import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const template = fs.readFileSync("src/templates/phase4341OneFlagshipTemplate.ts", "utf8");
const registry = fs.readFileSync("src/templates/phase43ProfessionalTemplateEcosystem.ts", "utf8");
const screen = fs.readFileSync("src/app/template-ecosystem.tsx", "utf8");

test("Phase 43.4.1 contains exactly one flagship template", () => {
  assert.match(registry, /PHASE43_TEMPLATE_COUNT = PHASE43_TEMPLATES\.length/);
  assert.match(registry, /templates: \[PHASE4341_ONE_FLAGSHIP_TEMPLATE\]/);
  assert.doesNotMatch(registry, /PHASE434_FLAGSHIP_20/);
});

test("flagship template includes rich artwork and editable hierarchy", () => {
  assert.match(template, /premium-artwork/);
  assert.match(template, /headline/);
  assert.match(template, /section-title/);
  assert.match(template, /cta-primary/);
  assert.match(template, /qualityScore: 100/);
  assert.match(template, /hasTypographyHierarchy/);
});

test("template center is configured for one-template review", () => {
  assert.match(screen, /One flagship premium template/);
  assert.match(screen, /One fully rebuilt, agency-style business flyer/);
});
