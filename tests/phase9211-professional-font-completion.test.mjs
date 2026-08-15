import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");
const typography = read("src/utils/typographyManager.ts");
const manager = read("src/components/publisher/FontManagerModal.tsx");
const textFonts = read("src/data/textFonts.ts");
const pkg = JSON.parse(read("package.json"));

test("92.11 baseline remains present in later font releases", () => {
  const [major, minor] = pkg.version.split(".").map(Number);
  assert.ok(major > 92 || (major === 92 && minor >= 11));
  assert.match(pkg.scripts["verify:phase92.11"], /test:phase92\.11/);
});

test("all text pickers use the centralized Publisher font registry", () => {
  assert.match(textFonts, /FONT_FAMILIES/);
  assert.match(textFonts, /FONT_FAMILIES\.map/);
  assert.doesNotMatch(textFonts, /label: 'Arial'.*label: 'System'/s);
});

test("professional font manager exposes document and missing-font views", () => {
  assert.match(manager, /Document Fonts/);
  assert.match(manager, /Missing/);
  assert.match(manager, /missingDocumentFonts/);
  assert.match(manager, /fontSourceLabel/);
  assert.match(manager, /Variable/);
});

test("font intelligence includes style metadata, language aliases, replacement candidates, and runtime text checks", () => {
  assert.match(typography, /FontStyleName/);
  assert.match(typography, /VARIABLE_FONT_FAMILIES/);
  assert.match(typography, /FONT_SEARCH_ALIASES/);
  assert.match(typography, /amharic/);
  assert.match(typography, /persian/);
  assert.match(typography, /simplified chinese/);
  assert.match(typography, /fontReplacementCandidates/);
  assert.match(typography, /browserFontSupportsText/);
  assert.match(typography, /document\.fonts\.check\(`12px/);
});
