import test from "node:test";
import assert from "node:assert/strict";
import { applyGuideDrop, detectAnchorCycles, guideFromRuler, layerAllowsRendering, pasteboardBounds, refreshLiveAnchors, resolveLiveSnap, spreadGeometry } from "../src/utils/liveCanvasLayoutEngine";
import type { PublisherPage, PublisherProject } from "../src/types/publisher";

const page: PublisherPage = { id:"p1", name:"Page 1", width:600, height:800, margin:36, bleed:12, backgroundColor:"#fff", elements:[{id:"a",name:"A",type:"rectangle",x:100,y:100,width:50,height:50,rotation:0,zIndex:1,opacity:1},{id:"b",name:"B",type:"rectangle",x:205,y:100,width:50,height:50,rotation:0,zIndex:2,opacity:1}] } as any;
const project: PublisherProject = { id:"project",name:"Test",pages:[page],activePageId:"p1",createdAt:0,updatedAt:0,phase124Data:{guidePresets:[],gridPresets:[],interaction:{magnetStrength:1,snapPriority:["objects","guides","margins","grid","page"],showSnapLabels:true,showDistances:true,showEqualSpacing:true,altDisablesSnap:true,pasteboardSize:400,pasteboardSnap:true}} } as any;

test("live snapping respects priority and Alt override",()=>{const snapped=resolveLiveSnap(project,page,page.elements[0],154,100);assert.equal(snapped.x,155);assert.equal(snapped.labelX,"objects");assert.equal(resolveLiveSnap(project,page,page.elements[0],154,100,{altKey:true}).x,154);});
test("ruler guides convert screen coordinates by zoom",()=>{const guide=guideFromRuler(page,"vertical",240,2);assert.equal(guide.position,120);assert.equal(applyGuideDrop(page,guide).layoutSettings?.guides.length,1);});
test("pasteboard and facing spread geometry are deterministic",()=>{assert.equal(pasteboardBounds(project,page).x,-400);const p2={...page,id:"p2"};const geometry=spreadGeometry({...project,pages:[page,p2],spreadSettings:{facingPages:true,pageGap:20}} as any);assert.equal(geometry[1].side,"left");});
test("layers control canvas and export visibility",()=>{const layered={...project,layers:[{id:"hidden",name:"Hidden",visible:false,locked:false,printable:true,color:"#000",order:0}]} as any;assert.equal(layerAllowsRendering(layered,{...page.elements[0],layerId:"hidden"} as any),false);});
test("anchor refresh detects and avoids circular frame anchors",()=>{const cyclic={...page,elements:[{...page.elements[0],id:"f1",isFrame:true,anchorMode:"frame",anchorTargetId:"f2"},{...page.elements[1],id:"f2",isFrame:true,anchorMode:"frame",anchorTargetId:"f1"}]} as any;assert.equal(detectAnchorCycles(cyclic).length,1);assert.deepEqual(refreshLiveAnchors(cyclic).elements.map(e=>e.x),[100,205]);});
