import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherElement } from "../src/types/publisher";
import { createPixelBuffer } from "../src/utils/professionalRasterPixelEngine";
import { auditPhase1711, commitRasterStroke, compositeBuffers, cropRasterBuffer, ensureNonDestructiveRasterSource, renderCompleteRasterPipeline, selectionToPixelMask } from "../src/utils/professionalRasterFinalIntegration";

const image: PublisherElement = { id:"img",type:"image",name:"Image",x:0,y:0,width:100,height:100,rotation:0,zIndex:0,opacity:1,visible:true,locked:false,imageUri:"data:image/png;base64,AA==",rasterCrop:{x:0,y:0,width:.5,height:.5,angle:0,perspective:false},rasterOpacity:.8,rasterBlendMode:"multiply",rasterAdjustments:[],rasterSmartFilters:[],rasterMasks:[],rasterRetouchStrokes:[] } as PublisherElement;

test("Phase 17.11 preserves original and preview sources",()=>{const out=ensureNonDestructiveRasterSource(image);assert.equal(out.rasterOriginalImageUri,image.imageUri);assert.equal(out.phase17Version,"17.13");});

test("Phase 17.11 crop, selection and compositing execute",()=>{const b=createPixelBuffer(8,8,8);for(let i=0;i<b.data.length;i+=4){b.data[i]=255;b.data[i+3]=255;}const crop=cropRasterBuffer(b,image.rasterCrop);assert.equal(crop.width,4);assert.equal(crop.height,4);const mask=selectionToPixelMask({id:"s",kind:"rectangle",name:"Rect",enabled:true,inverted:false,feather:0,expand:0,antialias:true,points:[{x:0,y:0},{x:.5,y:.5}]},8,8);assert.ok(mask.data.some(v=>v===1));const mixed=compositeBuffers(b,b,.5,"screen",mask);assert.equal(mixed.width,8);});

test("Phase 17.11 complete pipeline and stroke commit",()=>{const b=createPixelBuffer(8,8,8);for(let i=0;i<b.data.length;i+=4)b.data[i+3]=255;const out=renderCompleteRasterPipeline(image,b);assert.equal(out.width,4);const next=commitRasterStroke(image,{tool:"brush",points:[{x:.1,y:.1},{x:.5,y:.5}]},{size:10,hardness:.8,opacity:.7,flow:1,spacing:.1,color:[1,1,1,1]});assert.equal(next.rasterRetouchStrokes?.length,1);assert.ok(auditPhase1711(next).length>0);});
