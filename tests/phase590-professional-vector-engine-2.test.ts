import test from "node:test";
import assert from "node:assert/strict";
import { addVectorEffect, booleanVectorOperation, convertLiveShapeToPath, createCompoundPath, deleteVectorNodes, exportVectorSvg2, importVectorSvg2, insertVectorNode, moveVectorNode, setAdvancedPatternFill, setMeshGradient, setVariableWidthProfile } from "../src/utils/professionalVectorEngine2";

const base:any={id:"v1",name:"Vector",type:"shape",x:0,y:0,width:100,height:100,rotation:0,opacity:1,visible:true,locked:false,zIndex:1,fillColor:"#fff",borderColor:"#111",borderWidth:2,editableVector:true,vectorNodes:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],vectorClosed:true};
const second:any={...base,id:"v2",x:50,zIndex:2};

test("Phase 59 boolean and compound paths",()=>{assert.ok(booleanVectorOperation([base,second],["v1","v2"],"union").created);assert.equal(createCompoundPath([base,second],["v1","v2"]).created?.vectorWinding,"evenodd");});
test("Phase 59 mesh, pattern and variable width fills",()=>{const mesh=setMeshGradient(base,{rows:2,columns:2,points:[]});assert.equal(mesh.vectorMeshGradient.points.length,4);assert.ok(setAdvancedPatternFill(base,{type:"dots",foreground:"#000",background:"#fff",size:8}).vectorPatternTransform);assert.equal(setVariableWidthProfile(base,[{offset:0,width:.2},{offset:1,width:2}]).vectorWidthProfile.profile,"custom");});
test("Phase 59 advanced node editing and live shape conversion",()=>{let e=insertVectorNode(base,1,{x:50,y:0});e=moveVectorNode(e,1,0,20);e=deleteVectorNodes(e,[0]);assert.equal(e.vectorNodes.length,3);assert.equal(e.vectorNodes[0].y,20);assert.equal((convertLiveShapeToPath(base,"star",{points:5}) as any).liveShape.converted,true);});
test("Phase 59 effects and improved SVG round trip",()=>{const effected=addVectorEffect(base,{type:"roughen",amount:.2,enabled:true});assert.equal(effected.vectorEffects2.length,1);const svg=exportVectorSvg2(base,{includeMetadata:true});assert.match(svg,/Professional Vector Engine 2/);const imported=importVectorSvg2(svg);assert.equal(imported.length,1);assert.equal(imported[0].editableVector,true);});
