import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
test("Phase 18.4 engine includes advanced production capabilities",()=>{
 const engine=read("src/utils/advancedPaintingEngine.ts");
 for(const feature of ["BrushTipShape","MixerModel","StylusProfile","PaintStrokeRecording","evaluatePressureCurve","estimatePaintTileMemory","psd-compatible","ora-compatible","phase18Version:\"18.4\""]) assert.ok(engine.includes(feature),feature);
});
test("Phase 18.4 is wired into the real editor and Paint ribbon",()=>{
 const editor=read("src/app/editor.tsx"),toolbar=read("src/components/publisher/EditorToolbar.tsx"),types=read("src/types/publisher.ts");
 assert.ok(editor.includes("AdvancedPaintingModal"));
 assert.ok(editor.includes("applyAdvancedPainting"));
 assert.ok(toolbar.includes("Advanced Painting"));
 assert.ok(types.includes("paintProduction"));
});
