import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Phase 24.2A.4 marketplace engine exists", () => {
  const source = read("src/templates/templateMarketplace.ts");
  assert.match(source, /createMarketplaceRecord/);
  assert.match(source, /applyTemplateReview/);
  assert.match(source, /searchMarketplace/);
  assert.match(source, /rankMarketplaceTemplates/);
});

test("Phase 24.2A.4 template manager supports lifecycle operations", () => {
  const source = read("src/templates/templateManager.ts");
  for (const name of ["duplicateManagedTemplate", "renameManagedTemplate", "archiveManagedTemplate", "restoreManagedTemplate", "createTemplateVersion", "exportTemplateCollection", "importTemplateCollection"]) {
    assert.match(source, new RegExp(name));
  }
});

test("Phase 24.2A.4 storage and documentation are included", () => {
  assert.ok(fs.existsSync(path.join(root, "src/templates/templateMarketplaceStorage.ts")));
  assert.ok(fs.existsSync(path.join(root, "PHASE24.2A.4-PROFESSIONAL-TEMPLATE-MARKETPLACE-AND-TEMPLATE-MANAGER.md")));
});

test("package version and scripts identify Phase 24.2A.4", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.version, "24.2.4");
  assert.ok(pkg.scripts["test:phase24.2a4"]);
});
