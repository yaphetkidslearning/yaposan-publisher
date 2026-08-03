import test from "node:test";
import assert from "node:assert/strict";
import { createPixelBuffer } from "../src/utils/professionalRasterPixelEngine";
import { renderCompleteRasterPipeline, selectionToPixelMask } from "../src/utils/professionalRasterFinalIntegration";
import type { PublisherElement } from "../src/types/publisher";

function imageElement(): PublisherElement {
  return {
    id: "image-1", name: "Raster", type: "image", x: 0, y: 0, width: 100, height: 100,
    rotation: 0, zIndex: 1, opacity: 1, imageUri: "memory://image", phase17Version: "17.12",
    rasterCanvasTool: "brush", rasterCanvasBrushColor: [1, 0, 0, 1],
    rasterRetouchStrokes: [{ id: "s1", tool: "brush", points: [{x:.1,y:.1},{x:.9,y:.9}], size: 8, strength: 1, hardness: .8, color: [1,0,0,1] }],
  } as PublisherElement;
}

test("Phase 17.12 rectangle selection produces an executable mask", () => {
  const mask = selectionToPixelMask({id:"r",kind:"rectangle",name:"r",enabled:true,inverted:false,feather:0,expand:0,antialias:true,points:[{x:.25,y:.25},{x:.75,y:.75}]}, 20, 20);
  assert.equal(mask.data[10 * 20 + 10], 1);
  assert.equal(mask.data[0], 0);
});

test("Phase 17.12 direct canvas brush stroke changes pixels", () => {
  const source = createPixelBuffer(32, 32, 8, "srgb");
  const result = renderCompleteRasterPipeline(imageElement(), source);
  assert.notDeepEqual(Array.from(result.data), Array.from(source.data));
});
