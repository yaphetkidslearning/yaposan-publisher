import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const toolbar=read("src/components/publisher/EditorToolbar.tsx");

test("92.15 Word-style font flyout remains present",()=>{
  assert.match(toolbar,/fontDropdownBackdrop/);
  assert.match(toolbar,/fontDropdownPanel/);
  assert.match(toolbar,/backgroundColor: "transparent"/);
  assert.match(toolbar,/Open Font Manager/);
});

test("font flyout preserves search, categories, previews, and outside-click close",()=>{
  assert.match(toolbar,/fontSearch/);
  assert.match(toolbar,/fontCategory/);
  assert.match(toolbar,/fontDropdownPreview/);
  assert.match(toolbar,/setFontDropdownOpen\(false\)/);
});
