import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");
const typography = read("src/utils/typographyManager.ts");
const manager = read("src/components/publisher/FontManagerModal.tsx");
const editor = read("src/app/editor.tsx");
const canvas = read("src/components/publisher/PublisherCanvas.tsx");
const svg = read("src/utils/pageSvgExport.ts");
const web = read("src/utils/digitalWebsiteExportEngine.ts");
const pkg = JSON.parse(read("package.json"));

test("92.10 verification remains available after later font releases", () => {
  assert.ok(Number(pkg.version.split(".")[0]) >= 92);
  assert.match(pkg.scripts["verify:phase92.10"], /test:phase92\.10/);
});

test("font runtime detects scripts, direction, and builds fallback stacks", () => {
  assert.match(typography, /export function detectScripts/);
  assert.match(typography, /export function detectTextDirection/);
  assert.match(typography, /export function fontCssStack/);
  assert.match(typography, /scriptFallbackFamilies/);
  assert.match(typography, /Ethiopic/);
  assert.match(typography, /Arabic/);
  assert.match(typography, /CJK/);
});

test("font manager supports local discovery and compatibility filtering", () => {
  assert.match(typography, /queryLocalFonts/);
  assert.match(typography, /loadDiscoveredLocalFonts/);
  assert.match(manager, /Find local fonts/);
  assert.match(manager, /Compatible with selected text/);
  assert.match(manager, /Import TTF\/OTF/);
  assert.match(editor, /discoverInstalledFonts/);
  assert.match(editor, /availableFontFamilies/);
});

test("canvas and exports preserve multilingual direction and fallback", () => {
  assert.match(canvas, /writingDirection: textDirection/);
  assert.match(canvas, /unicodeBidi: "plaintext"/);
  assert.match(svg, /direction="\$\{direction\}"/);
  assert.match(svg, /fontCssStack/);
  assert.match(web, /dir="\$\{direction\}"/);
  assert.match(web, /fontCssStack/);
});
