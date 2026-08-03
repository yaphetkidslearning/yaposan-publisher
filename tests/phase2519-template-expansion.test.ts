import { PHASE2519_TEMPLATE_COUNT, PHASE2519_TEMPLATES } from "../src/templates/phase2519TemplateExpansion";
import { ALL_PROFESSIONAL_TEMPLATES } from "../src/templates/builtInTemplates";

describe("Phase 25.19 template expansion", () => {
  it("adds 507 editable templates", () => {
    expect(PHASE2519_TEMPLATE_COUNT).toBe(507);
    expect(PHASE2519_TEMPLATES).toHaveLength(507);
    expect(PHASE2519_TEMPLATES.every((template) => template.metadata.editable)).toBe(true);
  });

  it("keeps template ids unique in the full professional registry", () => {
    const ids = ALL_PROFESSIONAL_TEMPLATES.map((template) => template.metadata.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(1131);
  });
});
