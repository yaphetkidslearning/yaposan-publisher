import { PHASE2526_TEMPLATE_COUNT, PHASE2526_TEMPLATES } from "../src/templates/phase2526ProfessionalTemplateLibrary";
import { ALL_PROFESSIONAL_TEMPLATES } from "../src/templates/builtInTemplates";

describe("Phase 25.26 professional template library", () => {
  it("contains exactly 100 new templates", () => {
    expect(PHASE2526_TEMPLATE_COUNT).toBe(100);
  });

  it("uses unique ids and names", () => {
    expect(new Set(PHASE2526_TEMPLATES.map((template) => template.metadata.id)).size).toBe(100);
    expect(new Set(PHASE2526_TEMPLATES.map((template) => template.metadata.name)).size).toBe(100);
  });

  it("registers every template in the active browser library", () => {
    const activeIds = new Set(ALL_PROFESSIONAL_TEMPLATES.map((template) => template.metadata.id));
    expect(PHASE2526_TEMPLATES.every((template) => activeIds.has(template.metadata.id))).toBe(true);
  });

  it("keeps all templates editable and populated", () => {
    expect(PHASE2526_TEMPLATES.every((template) => template.metadata.editable)).toBe(true);
    expect(PHASE2526_TEMPLATES.every((template) => template.pages.length > 0 && template.pages[0].elements.length >= 5)).toBe(true);
  });
});
