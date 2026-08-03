import test from "node:test";
import assert from "node:assert/strict";
import { createPixelBuffer } from "../src/utils/professionalRasterPixelEngine";
import { combineSelectionMasks, renderCompleteRasterPipeline, selectionToPixelMask } from "../src/utils/professionalRasterFinalIntegration";
import type { PublisherElement } from "../src/types/publisher";
const image=(mode:"replace"|"add"|"subtract"|"intersect"="replace"):PublisherElement=>({id:"i",name:"Image",type:"image",x:0,y:0,width:100,height:100,rotation:0,zIndex:0,opacity:1,visible:true,locked:false,imageUri:"data:image/png;base64,x",rasterRuntime:{selection:{mode,marchingAnts:true,edgeRefine:0,decontaminateColors:false,hairRefinement:false,magicWandTolerance:32,contiguous:true}} as any,rasterSelections:[{id:"s",kind:"rectangle",name:"s",enabled:true,inverted:false,feather:1,expand:1,antialias:true,points:[{x:0,y:0},{x:.5,y:1}]}]} as PublisherElement);
test("selection feather and expand execute",()=>{const m=selectionToPixelMask(image().rasterSelections![0],20,20);assert.equal(m.data.length,400);assert.ok(m.data.some(v=>v>0&&v<1));});
test("active selections restrict raster rendering",()=>{const src=createPixelBuffer(20,20,8);for(let i=0;i<src.data.length;i+=4){src.data[i]=64;src.data[i+1]=64;src.data[i+2]=64;src.data[i+3]=255;}const el={...image(),imageAdjustments:{brightness:200,contrast:100,saturation:100,exposure:0,highlights:0,shadows:0,warmth:0,tint:0,grayscale:0,sepia:0,blur:0}};const out=renderCompleteRasterPipeline(el,src);assert.notEqual(out.data[0],out.data[(19*20+19)*4]);});
test("selection masks combine",()=>{const e=image("add");const m=combineSelectionMasks(e.rasterSelections!,10,10,"add");assert.ok(m&&m.data.some(v=>v>0));});
