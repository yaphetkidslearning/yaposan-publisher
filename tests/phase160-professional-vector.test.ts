import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";
import { auditProfessionalVectors, closeVectorPath, createCompoundVector, reverseVectorPath, simplifyVectorPath, smoothVectorPath, vectorElementToSvg, vectorProjectSummary } from "../src/utils/professionalVectorEngine";

const path: PublisherElement = { id:"v1",name:"Curve",type:"line",x:10,y:10,width:100,height:80,rotation:0,zIndex:1,opacity:1,borderColor:"#111827",borderWidth:3,fillColor:"transparent",shapeKind:"bezier-path",editableVector:true,vectorNodes:[{x:0,y:0},{x:20,y:1},{x:50,y:40},{x:100,y:80}] };
const rect: PublisherElement = { id:"r1",name:"Box",type:"rectangle",x:60,y:30,width:80,height:70,rotation:0,zIndex:2,opacity:1,fillColor:"#7C3AED",borderColor:"transparent",borderWidth:0 };

test("Phase 16 path editing remains serializable",()=>{
 const closed=closeVectorPath(path,true); assert.equal(closed.vectorClosed,true);
 const reversed=reverseVectorPath(closed); assert.equal(reversed.vectorNodes?.[0].x,100);
 const simplified=simplifyVectorPath(path,2); assert.ok((simplified.vectorNodes?.length??0)<(path.vectorNodes?.length??0));
 const smoothed=smoothVectorPath(path,.3); assert.equal(smoothed.vectorNodes?.[1].kind,"smooth");
 const svg=vectorElementToSvg(closed); assert.match(svg,/<path/); assert.match(svg,/ Z"/);
});

test("Phase 16 Boolean construction preserves sources",()=>{
 const result=createCompoundVector([path,rect],[path.id,rect.id],"union");
 assert.ok(result.created); assert.equal(result.created?.shapeKind,"compound-path"); assert.equal(result.created?.compoundSources?.length,2); assert.equal(result.elements.length,1);
});

test("Phase 16 audit and summary inspect project vectors",()=>{
 const project:PublisherProject={id:"p",name:"Vector",createdAt:1,updatedAt:1,activePageId:"page",autoSave:true,version:2,pages:[{id:"page",name:"Page",width:800,height:600,orientation:"landscape",sizeKey:"custom",backgroundColor:"#fff",margin:20,bleed:0,elements:[path]}]};
 const summary=vectorProjectSummary(project); assert.equal(summary.vectors,1); assert.equal(summary.nodes,4); assert.deepEqual(auditProfessionalVectors(project),[]);
});
