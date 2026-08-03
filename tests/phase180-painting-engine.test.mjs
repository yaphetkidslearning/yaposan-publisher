import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(file)=>fs.readFileSync(file,"utf8");
test("Phase 18 painting engine is integrated into the real editor",()=>{
  const editor=read("src/app/editor.tsx");
  const toolbar=read("src/components/publisher/EditorToolbar.tsx");
  const canvas=read("src/components/publisher/PublisherCanvas.tsx");
  const engine=read("src/utils/paintingEngine.ts");
  assert.match(editor,/PaintingStudioModal/);
  assert.match(editor,/paintingSettings=\{paintingSettings\}/);
  assert.match(toolbar,/"Paint"/);
  assert.match(toolbar,/Painting Studio/);
  assert.match(canvas,/smoothPaintPoints/);
  assert.match(canvas,/paintingElementPatch/);
  assert.match(engine,/watercolor-wash/);
  assert.match(engine,/oil-bristle/);
  assert.match(engine,/pressureSize/);
  assert.match(engine,/paintBlendMode/);
});

test("Phase 18 has no duplicate painting editor route",()=>{
  const files=fs.readdirSync("src/app").filter(name=>/paint/i.test(name));
  assert.equal(files.length,0);
});
