import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherElement, PublisherPage } from "../src/types/publisher";
import { alignSelection, centerSelection, clampSelectionToPage, distributeSelection, equalizeSpacing, matchDimensions, matchPosition } from "../src/utils/alignmentEngine";

const element = (id:string,x:number,y:number,width=40,height=30,locked=false):PublisherElement => ({ id,name:id,type:"rectangle",x,y,width,height,rotation:0,zIndex:1,opacity:1,fillColor:"#fff",locked });
const page = (elements:PublisherElement[]):PublisherPage => ({ id:"p",name:"Page",width:600,height:800,orientation:"portrait",sizeKey:"custom",backgroundColor:"#fff",margin:50,bleed:12,elements });

test("aligns a selection to page and margin references", () => {
  let next = alignSelection(page([element("a",100,100),element("b",220,160)]),["a","b"],"center","page");
  assert.equal(next.elements[0].x,280);
  assert.equal(next.elements[1].x,280);
  next = alignSelection(next,["a","b"],"left","margins");
  assert.equal(next.elements[0].x,50);
  assert.equal(next.elements[1].x,50);
});

test("key object alignment preserves key and locked objects", () => {
  const next = alignSelection(page([element("key",140,120),element("move",300,200),element("locked",400,240,40,30,true)]),["key","move","locked"],"top","key-object","key");
  assert.equal(next.elements[0].y,120);
  assert.equal(next.elements[1].y,120);
  assert.equal(next.elements[2].y,240);
});

test("distribution and exact equal spacing are deterministic", () => {
  let next = distributeSelection(page([element("a",0,0,20),element("b",100,0,20),element("c",300,0,20)]),["a","b","c"],"horizontal","selection");
  assert.equal(next.elements[1].x,150);
  next = equalizeSpacing(next,["a","b","c"],"horizontal",12);
  assert.deepEqual(next.elements.map(e=>e.x),[0,32,64]);
});

test("dimensions and positions match the selected key object", () => {
  let next = matchDimensions(page([element("key",10,20,80,60),element("b",200,220,30,20)]),["key","b"],"both","key");
  assert.equal(next.elements[1].width,80);
  assert.equal(next.elements[1].height,60);
  next = matchPosition(next,["key","b"],"both","key");
  assert.equal(next.elements[1].x,10);
  assert.equal(next.elements[1].y,20);
});

test("centering preserves selection geometry and clamp keeps objects on page", () => {
  let next = centerSelection(page([element("a",0,0),element("b",60,0)]),["a","b"],"page","both");
  assert.equal(next.elements[1].x-next.elements[0].x,60);
  assert.equal((next.elements[0].x+next.elements[1].x+40)/2,300);
  next = clampSelectionToPage(page([element("a",-20,-10),element("b",590,790,40,30)]),["a","b"]);
  assert.deepEqual(next.elements.map(e=>[e.x,e.y]),[[0,0],[560,770]]);
});
