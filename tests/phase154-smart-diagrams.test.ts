import test from "node:test";
import assert from "node:assert/strict";
import { countDiagramRoles, createSmartDiagram, diagramBounds, type SmartDiagramType } from "../src/utils/smartDiagramEngine";
let id=0; const nextId=()=>`diagram-${++id}`;
const types:SmartDiagramType[]=["organization","flowchart","timeline","mind-map","process","decision-tree","pyramid","cycle","venn","swimlane"];
for(const type of types)test(`creates editable ${type} diagram`,()=>{id=0;const elements=createSmartDiagram(nextId,1,{type,title:"Test Diagram",nodes:[{title:"One"},{title:"Two"},{title:"Three"},{title:"Four"},{title:"Five"}]});assert.ok(elements.length>=5);assert.ok(elements.every(element=>element.groupId));assert.ok(elements.some(element=>element.type==="text"));const bounds=diagramBounds(elements);assert.ok(bounds.width>0);assert.ok(bounds.height>0);});
test("flowchart has nodes and routed connectors",()=>{id=0;const elements=createSmartDiagram(nextId,1,{type:"flowchart",nodes:[{title:"Start"},{title:"Review"},{title:"Finish"}]});const roles=countDiagramRoles(elements);assert.ok((roles.node??0)>=3);assert.ok((roles.connector??0)>=2);assert.ok(elements.filter(e=>(e as any).diagramRole==="connector").every(e=>(e as any).connectorRouting==="orthogonal"));});
test("venn diagram retains transparent editable circles",()=>{id=0;const elements=createSmartDiagram(nextId,1,{type:"venn"});const circles=elements.filter(e=>(e as any).diagramRole==="venn-circle");assert.equal(circles.length,2);assert.ok(circles.every(e=>e.opacity<1));});
test("swimlane diagram creates lane headers",()=>{id=0;const elements=createSmartDiagram(nextId,1,{type:"swimlane"});const roles=countDiagramRoles(elements);assert.equal(roles["lane-header"],3);});
