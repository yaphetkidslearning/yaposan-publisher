import { PHASE2527_COUNTS_BY_SUBCATEGORY, PHASE2527_TEMPLATE_COUNT, PHASE2527_TEMPLATES } from "../src/templates/phase2527ProfessionalTemplateLibrary";

describe("Phase 25.27 professional template library", () => {
  test("contains exactly 100 templates", () => {
    expect(PHASE2527_TEMPLATE_COUNT).toBe(100);
    expect(PHASE2527_TEMPLATES).toHaveLength(100);
  });

  test("contains ten templates per subcategory", () => {
    expect(Object.values(PHASE2527_COUNTS_BY_SUBCATEGORY)).toEqual(Array(10).fill(10));
  });

  test("uses unique ids and editable pages", () => {
    const ids = PHASE2527_TEMPLATES.map((template) => template.metadata.id);
    expect(new Set(ids).size).toBe(100);
    expect(PHASE2527_TEMPLATES.every((template) => template.metadata.editable && template.pages[0]?.elements.length >= 4)).toBe(true);
  });
});
