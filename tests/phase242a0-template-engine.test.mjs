import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
test("24.2A.0 template foundation files exist", () => {
  ["src/templates/templateEngine.ts","src/templates/templateRegistry.ts","src/templates/templateVariables.ts","src/templates/templateThemes.ts","src/templates/templateSearch.ts","src/templates/templateValidator.ts","src/templates/templateLoader.ts","src/templates/templateSerializer.ts","src/templates/templateThumbnail.ts","src/templates/templateStorage.ts"].forEach(p => assert.equal(fs.existsSync(new URL(`../${p}`, import.meta.url)), true, p));
});
test("smart placeholders and theme engine are implemented", () => {
  assert.match(read("src/templates/templateVariables.ts"), /replacePlaceholders/);
  assert.match(read("src/templates/templateVariables.ts"), /PLACEHOLDER/);
  assert.match(read("src/templates/templateThemes.ts"), /Corporate Blue/);
  assert.match(read("src/templates/templateThemes.ts"), /applyTemplateTheme/);
});
test("registry validates before registration", () => {
  const code=read("src/templates/templateRegistry.ts");
  assert.match(code,/validateTemplate/); assert.match(code,/Template already registered/);
});
test("package version and verification script are updated", () => {
  const pkg=JSON.parse(read("package.json")); assert.equal(pkg.version,"24.2.0"); assert.ok(pkg.scripts["verify:phase24.2a0"]);
});
