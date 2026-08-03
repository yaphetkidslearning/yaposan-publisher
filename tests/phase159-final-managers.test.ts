import test from "node:test";
import assert from "node:assert/strict";
import { auditPhase15ExportReadiness, dataSourceRegistrySummary, detachProjectDataSource, rebuildDiagramConnectors } from "../src/utils/phase15FinalManagerEngine";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";

const source:any={id:"s1",name:"Sales.xlsx",type:"excel",sheetName:"Sheet1",linkedAt:new Date().toISOString(),status:"ready",headers:["Month","Sales"],rows:[{Month:"Jan",Sales:10}],refreshPolicy:"manual"};
const chart:any={id:"c1",name:"Sales",type:"svg",x:0,y:0,width:300,height:200,rotation:0,zIndex:1,opacity:1,chartType:"column",chartData:[{label:"Jan",value:10}],linkedDataSource:source,dataObjectKind:"linked-chart"};
const project:any={id:"p1",name:"Test",createdAt:1,updatedAt:1,activePageId:"pg",dataSourceRegistry:{s1:source},pages:[{id:"pg",name:"Page 1",width:800,height:1000,elements:[chart]}]};

test("data source manager summarizes and removes sources",()=>{
  assert.equal(dataSourceRegistrySummary(project.dataSourceRegistry)[0].sheetName,"Sheet1");
  const detached=detachProjectDataSource(project,"s1");
  assert.equal(Object.keys(detached.dataSourceRegistry??{}).length,0);
  assert.equal(detached.pages[0].elements[0].dataRefreshStatus,"missing");
});

test("diagram connector rebuild creates relationships",()=>{
  const nodes=[
    {id:"n1",name:"One",type:"rectangle",x:10,y:10,width:100,height:50,rotation:0,zIndex:1,opacity:1,groupId:"g",diagramRole:"node",diagramType:"flowchart"},
    {id:"n2",name:"Two",type:"rectangle",x:10,y:100,width:100,height:50,rotation:0,zIndex:2,opacity:1,groupId:"g",diagramRole:"node",diagramType:"flowchart"},
  ] as PublisherElement[];
  const rebuilt=rebuildDiagramConnectors(nodes,"g");
  const connector=rebuilt.find(e=>e.diagramRole==="connector");
  assert.equal(connector?.diagramFromId,"n1");
  assert.equal(connector?.diagramToId,"n2");
});

test("export readiness reports clean Phase 15 project",()=>{
  const checks=auditPhase15ExportReadiness(project as PublisherProject);
  assert.equal(checks[0].severity,"info");
});
