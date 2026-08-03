import test from "node:test";
import assert from "node:assert/strict";
import { applyBrightnessContrast, applyPixelKernel, cloneStamp, combineSelectionMasks, createPixelBuffer, createRectSelection, focusStack, healSpot, mergeHDR, paintBrushStroke } from "../src/utils/professionalRasterPixelEngine";

const solid=(v:number)=>{const b=createPixelBuffer(8,8,8);for(let i=0;i<b.data.length;i+=4){b.data[i]=v;b.data[i+1]=v;b.data[i+2]=v;b.data[i+3]=255;}return b;};
test("executes brightness and filter pixels",()=>{const b=solid(64);const out=applyBrightnessContrast(b,20,0);assert.ok(out.data[0]>b.data[0]);assert.equal(applyPixelKernel(b,"gaussian-blur",{radius:1}).data.length,b.data.length);});
test("combines executable selection masks",()=>{const a=createRectSelection(8,8,0,0,4,4),b=createRectSelection(8,8,3,3,4,4);assert.ok(combineSelectionMasks(a,b,"intersect").data.some(v=>v>0));});
test("renders pressure-aware brush strokes",()=>{const b=solid(0);const out=paintBrushStroke(b,[{x:1,y:1,pressure:.5},{x:6,y:6,pressure:1}],{size:3,hardness:.7,opacity:1,flow:1,spacing:.2,color:[1,0,0,1]});assert.ok(out.data.some((v,i)=>i%4===0&&v>0));});
test("executes clone and healing",()=>{const b=solid(80);b.data[0]=255;assert.equal(cloneStamp(b,{x:0,y:0},{x:4,y:4},1,1).data[(4*8+4)*4],255);assert.equal(healSpot(b,{x:0,y:0},2).data.length,b.data.length);});
test("executes HDR and focus fusion",()=>{const dark=solid(32),light=solid(192);const hdr=mergeHDR([dark,light]);assert.equal(hdr.depth,32);const focus=focusStack([dark,light]);assert.equal(focus.data.length,dark.data.length);});
