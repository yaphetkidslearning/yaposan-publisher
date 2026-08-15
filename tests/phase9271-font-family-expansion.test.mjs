import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const constants = readFileSync("src/constants/publisher.ts", "utf8");
const toolbar = readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const typography = readFileSync("src/utils/typographyManager.ts", "utf8");

test("phase 92.7.1 ships more than 100 Publisher font families", () => {
  const block = constants.match(/export const FONT_FAMILIES = \[([\s\S]*?)\n\];/);
  assert.ok(block, "FONT_FAMILIES must exist");
  const families = [...block[1].matchAll(/\"([^\"]+)\"/g)].map((match) => match[1]);
  assert.ok(families.length >= 100, `expected at least 100 fonts, found ${families.length}`);
  for (const family of ["Arial", "Calibri", "Cambria", "Georgia", "Times New Roman", "Verdana", "Consolas", "Segoe UI", "Aptos"]) {
    assert.ok(families.includes(family), `missing expected family: ${family}`);
  }
});

test("phase 92.7.1 font dropdown behaves like an Office-style font browser", () => {
  assert.match(toolbar, /placeholder="Search fonts"/);
  assert.match(toolbar, /QUICK_FONT_CATEGORIES/);
  assert.match(toolbar, /FONT_FAMILIES\.map/);
  assert.match(toolbar, /Aa Bb Cc 123/);
  assert.match(toolbar, /visibleFontCount/);
  assert.match(toolbar, /fontDropdownItemActive/);
  assert.match(toolbar, /Open Font Manager/);
});

test("phase 92.7.1 keeps Font Manager synchronized with the main catalog", () => {
  assert.match(typography, /import \{ FONT_FAMILIES \}/);
  assert.match(typography, /FONT_FAMILIES\.map/);
  assert.match(typography, /Sans Serif/);
  assert.match(typography, /Monospace/);
  assert.match(typography, /Handwriting/);
});
