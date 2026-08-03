import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";
import { auditProfessionalVectors, deleteVectorNode, insertVectorNode, offsetVectorPath, setVectorArrowheads, setVectorStrokePattern, transformVectorPath, updateVectorNode, vectorElementToSvg } from "../src/utils/professionalVectorEngine";

const path: PublisherElement={id:"v",name:"Precision",type:"line",x:0,y:0,width:100,height:100,rotation:0,zIndex:1,opacity:1,borderColor:"#111827",borderWidth:3,fillColor:"transparent",shapeKind:"bezier-path",editableVector:true,vectorClosed:false,vectorNodes:[{x:0,y:0},{x:50,y:30},{x:100,y:100}]};

test("Phase 16.1 inserts, updates, and deletes individual nodes",()=>{
 const inserted=insertVectorNode(path,0); assert.equal(inserted.vectorNodes?.length,4); assert.equal(inserted.vectorNodes?.[1].x,25);
 const updated=updateVectorNode(inserted,1,{x:30,y:20,kind:"corner"}); assert.equal(updated.vectorNodes?.[1].x,30); assert.equal(updated.vectorNodes?.[1].kind,"corner");
 const removed=deleteVectorNode(updated,1); assert.equal(removed.vectorNodes?.length,3);
});

test("Phase 16.1 transforms and offsets editable geometry",()=>{
 const moved=transformVectorPath(path,{dx:10,dy:-5,scaleX:2,scaleY:1,rotate:0}); assert.equal(moved.vectorNodes?.[0].x,-40); assert.equal(moved.vectorNodes?.[0].y,-5);
 const offset=offsetVectorPath(path,5); assert.notEqual(offset.vectorNodes?.[0].x,path.vectorNodes?.[0].x); assert.equal(offset.vectorOffset,5);
});

test("Phase 16.1 exports advanced strokes and arrowheads",()=>{
 const dashed=setVectorStrokePattern(path,[10,6],2); const arrows=setVectorArrowheads(dashed,"circle","arrow"); const svg=vectorElementToSvg(arrows);
 assert.match(svg,/stroke-dasharray="10 6"/); assert.match(svg,/marker-start/); assert.match(svg,/marker-end/); assert.match(svg,/<defs>/);
});

test("Phase 16.1 audit detects overlapping nodes",()=>{
 const bad={...path,vectorNodes:[{x:0,y:0},{x:0,y:0},{x:20,y:20}]} as PublisherElement;
 const project:PublisherProject={id:"p",name:"Audit",createdAt:1,updatedAt:1,activePageId:"page",autoSave:true,version:2,pages:[{id:"page",name:"Page",width:500,height:500,orientation:"portrait",sizeKey:"custom",backgroundColor:"#fff",margin:20,bleed:0,elements:[bad]}]};
 assert.ok(auditProfessionalVectors(project).some(issue=>issue.id.startsWith("duplicate-")));
});
