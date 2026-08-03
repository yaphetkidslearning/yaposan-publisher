import test from "node:test";
import assert from "node:assert/strict";
import { addRasterAdjustment, addRasterMask, applyRasterPreset, auditRasterElement, normalizeRasterElement, rasterProjectSummary, recordRasterHistory } from "../src/utils/professionalRasterEngine";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";

const image:PublisherElement={name:"Image",id:"image-1",type:"image",x:0,y:0,width:300,height:200,rotation:0,opacity:1,zIndex:1,locked:false,hidden:false,imageUri:"data:image/png;base64,abc",originalImageUri:"data:image/png;base64,abc"};
test("normalizes professional raster controls",()=>{const next=normalizeRasterElement({...image,rasterOpacity:3,imageAdjustments:{brightness:999,exposure:-999}});assert.equal(next.rasterOpacity,1);assert.equal(next.imageAdjustments?.brightness,300);assert.equal(next.imageAdjustments?.exposure,-100)});
test("applies non-destructive presets",()=>{const next=applyRasterPreset(image,"cinematic");assert.equal(next.rasterPreset,"cinematic");assert.equal(next.imageAdjustments?.contrast,124)});
test("manages adjustment layers and masks",()=>{const adjusted=addRasterAdjustment(image,"curves",{midpoint:128});const masked=addRasterMask(adjusted);assert.equal(masked.rasterAdjustments?.length,1);assert.equal(masked.rasterMasks?.length,1);assert.equal(masked.rasterMasks?.[0].points.length,4)});
test("records raster edit history",()=>{const next=recordRasterHistory(image,"Initial correction");assert.equal(next.rasterHistory?.length,1);assert.equal(next.rasterHistory?.[0].label,"Initial correction")});
test("audits and summarizes raster documents",()=>{assert.equal(auditRasterElement(image)[0].severity,"info");const project:PublisherProject={id:"p",name:"Photo",createdAt:1,updatedAt:1,pages:[{id:"pg",name:"Page",width:100,height:100,orientation:"portrait",sizeKey:"custom",backgroundColor:"#fff",margin:0,bleed:0,elements:[addRasterAdjustment(image,"levels")]}],activePageId:"pg",autoSave:true,version:2,phase17Version:"17.0"};const summary=rasterProjectSummary(project);assert.deepEqual(summary,{images:1,edited:1,adjustments:1,masks:0,selections:0,retouchStrokes:0})});
