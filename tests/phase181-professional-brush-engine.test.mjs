import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(file)=>fs.readFileSync(file,"utf8");
test("Phase 18.1 professional brush library is integrated",()=>{
 const library=read("src/utils/brushLibrary.ts");
 const studio=read("src/components/publisher/PaintingStudioModal.tsx");
 assert.match(library,/loadBrushLibrary/);
 assert.match(library,/saveBrushLibrary/);
 assert.match(library,/exportBrushPack/);
 assert.match(library,/importBrushPack/);
 assert.match(studio,/Search brushes/);
 assert.match(studio,/Save Custom Brush/);
 assert.match(studio,/Pressure Size/);
 assert.match(studio,/Dual Brush/);
});
test("Phase 18.1 stroke dynamics execute on the real canvas",()=>{
 const engine=read("src/utils/paintingEngine.ts");
 const canvas=read("src/components/publisher/PublisherCanvas.tsx");
 assert.match(engine,/applyBrushDynamics/);
 assert.match(engine,/predictPaintEndpoint/);
 assert.match(engine,/velocitySize/);
 assert.match(engine,/rotationJitter/);
 assert.match(canvas,/applyBrushDynamics\(smoothed,paint\)/);
 assert.match(canvas,/phase18Version:"18\.1"/);
});
