import { ALL_PROFESSIONAL_TEMPLATES, DISABLED_REPETITIVE_TEMPLATE_COUNT } from "../src/templates/builtInTemplates";

describe("Phase 25.21 professional template quality reset", () => {
  it("keeps the repetitive generated collection out of the active browser", () => {
    expect(DISABLED_REPETITIVE_TEMPLATE_COUNT).toBeGreaterThan(900);
    expect(ALL_PROFESSIONAL_TEMPLATES.some((template) => template.metadata.id.startsWith("phase2519-"))).toBe(false);
    expect(ALL_PROFESSIONAL_TEMPLATES.some((template) => template.metadata.id.startsWith("phase2518-"))).toBe(false);
    expect(ALL_PROFESSIONAL_TEMPLATES.some((template) => template.metadata.id.startsWith("p2513-"))).toBe(false);
  });

  it("keeps the handcrafted professional libraries active", () => {
    expect(ALL_PROFESSIONAL_TEMPLATES.length).toBeGreaterThan(10);
    expect(ALL_PROFESSIONAL_TEMPLATES.every((template) => template.pages.length > 0)).toBe(true);
  });
});
