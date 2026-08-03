import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const toolbar = readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const home = readFileSync("src/app/index.tsx", "utf8");
const brush = readFileSync("src/components/publisher/PaintingStudioModal.tsx", "utf8");
const retouch = readFileSync("src/components/publisher/RetouchStudioModal.tsx", "utf8");

test("home AI prompt has a fixed visible Generate action", () => {
  assert.match(home, /generateAction/);
  assert.match(home, /Generate with Yaposan AI/);
  assert.match(home, /justifyContent: "center"/);
});

test("ribbon compact commands do not use empty labels", () => {
  assert.doesNotMatch(toolbar, /label=""/);
  for (const label of ["Larger", "Smaller", "Color", "Bullets", "Numbering", "Undo", "Redo"]) assert.match(toolbar, new RegExp(`label="${label}"`));
});

test("font control opens a scrollable dropdown before the full manager", () => {
  assert.match(toolbar, /fontDropdownOpen/);
  assert.match(toolbar, /FONT_FAMILIES\.map/);
  assert.match(toolbar, /Open Font Manager/);
});

test("specialized tabs do not also receive the generic placeholder ribbon", () => {
  for (const tab of ["Review", "Mailings", "Paint", "Animation", "Digital"]) assert.match(toolbar, new RegExp(`"${tab}"`));
  assert.match(toolbar, /renderPaint\(\)/);
  assert.match(toolbar, /renderAnimation\(\)/);
  assert.match(toolbar, /renderDigital\(\)/);
});

test("user-facing painting dialogs no longer expose implementation phase numbers", () => {
  assert.doesNotMatch(brush, /Phase 18/);
  assert.doesNotMatch(retouch, /Phase 18/);
  assert.match(brush, /Professional Brush Studio/);
  assert.match(retouch, /Retouch & Liquify Studio/);
});
