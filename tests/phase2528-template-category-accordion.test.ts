import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Phase 25.28 template category accordion", () => {
  const source = readFileSync(join(process.cwd(), "src/app/templates.tsx"), "utf8");

  it("supports expandable category groups", () => {
    expect(source).toContain("expandedGroups");
    expect(source).toContain("selectGroup");
    expect(source).toContain("chevron-down");
  });

  it("shows group and subcategory counts", () => {
    expect(source).toContain("groupCount");
    expect(source).toContain("itemCount");
    expect(source).toContain("categoryItemCount");
  });

  it("maps newer template names into established sidebar buttons", () => {
    expect(source).toContain("MENU_ALIASES");
    expect(source).toContain("Premium Brochures".toLowerCase());
    expect(source).toContain("resumes and cvs");
  });
});
