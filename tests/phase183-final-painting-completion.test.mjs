import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(file)=>fs.readFileSync(new URL(`../${file}`,import.meta.url),"utf8");

test("Phase 18.3 engine provides layers masks symmetry perspective and patterns",()=>{
  const engine=read("src/utils/paintingCompletionEngine.ts");
  for(const token of ["PaintLayer","clipping-mask","radial","three-point","seamlessWrap","buildPhase18Manifest","phase18Version:\"18.3\""]) assert.ok(engine.includes(token),token);
});

test("Phase 18.3 is integrated into the real editor and Paint ribbon",()=>{
  const editor=read("src/app/editor.tsx");
  const toolbar=read("src/components/publisher/EditorToolbar.tsx");
  const types=read("src/types/publisher.ts");
  assert.ok(editor.includes("PaintingCompletionModal"));
  assert.ok(editor.includes("applyPaintingCompletion"));
  assert.ok(toolbar.includes("Painting Completion"));
  assert.ok(types.includes('"18.3"'));
  assert.ok(types.includes("paintLayers"));
});
