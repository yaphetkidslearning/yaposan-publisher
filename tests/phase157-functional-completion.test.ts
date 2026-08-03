import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTableFormula, recalculateTable, updateChartElement, upsertCalendarEvent, removeCalendarEvent, registerDataSource, removeDataSource, addDiagramNode, deleteDiagramNode, relayoutDiagram } from "../src/utils/phase15FunctionalCompletionEngine";
import { createChartElement } from "../src/utils/dataVisualizationEngine";
import { createLinkedDataSource } from "../src/utils/professionalDataObjectsEngine";
import type { PublisherElement } from "../src/types/publisher";

test("table formulas calculate references and aggregates", () => {
  const cells=[["10","20","=A1+B1"],["5","15","=SUM(A1:B2)"]];
  assert.equal(evaluateTableFormula("=A1+B1",cells),30);
  assert.equal(evaluateTableFormula("=SUM(A1:B2)",cells),50);
  const table={id:"t",name:"Table",type:"table",x:0,y:0,width:200,height:100,rotation:0,zIndex:1,opacity:1,tableCells:cells} as PublisherElement;
  assert.equal(recalculateTable(table).tableCalculatedCells?.[1][2],"50");
});

test("chart can be edited without losing geometry", () => {
  const chart=createChartElement("c",1,"column",[{label:"A",value:1}],"Old"); chart.x=240; chart.width=500;
  const next=updateChartElement(chart,{type:"line",title:"New",data:[{label:"B",value:7}],legendPosition:"bottom",showDataLabels:true});
  assert.equal(next.x,240); assert.equal(next.width,500); assert.equal(next.chartType,"line"); assert.match(next.svgMarkup??"",/New/);
});

test("calendar events support add edit move and delete", () => {
  const calendar={id:"cal",name:"Calendar",type:"table",x:0,y:0,width:500,height:400,rotation:0,zIndex:1,opacity:1,calendarEvents:[]} as PublisherElement;
  const added=upsertCalendarEvent(calendar,{id:"e1",date:"2026-08-01",title:"Launch",recurrence:"weekly"});
  assert.equal(added.calendarEvents?.length,1);
  const edited=upsertCalendarEvent(added,{id:"e1",date:"2026-08-02",title:"Launch updated",allDay:true});
  assert.equal(edited.calendarEvents?.[0].date,"2026-08-02");
  assert.equal(removeCalendarEvent(edited,"e1").calendarEvents?.length,0);
});

test("source registry and diagram node editing work", () => {
  const source=createLinkedDataSource({name:"Sales",type:"csv",headers:["Sales"],rows:[{Sales:10}]});
  const registry=registerDataSource({},source); assert.ok(registry[source.id]); assert.equal(Object.keys(removeDataSource(registry,source.id)).length,0);
  const base={id:"n1",name:"One",type:"rectangle",x:10,y:10,width:100,height:50,rotation:0,zIndex:1,opacity:1,groupId:"g",diagramRole:"node",diagramType:"process"} as PublisherElement;
  let count=1; const added=addDiagramNode([base],"g",()=>`n${++count}`,"Two"); assert.equal(added.length,3);
  const laid=relayoutDiagram(added,"g","horizontal");
  const laidNodes=laid.filter((element)=>element.diagramRole==="node");
  assert.ok(laidNodes[1].x>laidNodes[0].x);
  assert.equal(deleteDiagramNode(laid,"n2").length,1);
});
