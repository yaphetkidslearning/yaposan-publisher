import assert from "node:assert/strict";
import test from "node:test";
import { addDiagramNode, evaluateTableFormula, recalculateTable, regenerateCalendarElement, updateChartElement, validateDataSourceRegistry } from "../src/utils/phase15FunctionalCompletionEngine";
import { createCalendarElement, createChartElement } from "../src/utils/dataVisualizationEngine";

test("Phase 15.8 formulas preserve errors and recalculate", () => {
  assert.equal(evaluateTableFormula("=A1/B1", [["10","2"]]), 5);
  assert.equal(evaluateTableFormula("=A1/B1", [["10","0"]]), "#DIV/0!");
  const table:any={id:"t",name:"T",type:"table",x:0,y:0,width:100,height:100,rotation:0,zIndex:1,opacity:1,tableCells:[["2","3","=A1+B1"]]};
  assert.equal(recalculateTable(table).tableCalculatedCells?.[0][2], "5");
});

test("Phase 15.8 chart options change rendered SVG", () => {
  const chart=createChartElement("c",1,"column",[{label:"A",value:12}],"Sales");
  const changed=updateChartElement(chart,{showDataLabels:true,showGridlines:true,axisMax:20,legendPosition:"bottom"});
  assert.match(changed.svgMarkup??"",/>12<\/text>/);
  assert.equal(changed.chartLegendPosition,"bottom");
});

test("Phase 15.8 calendar changes redraw cells", () => {
  const calendar=createCalendarElement("cal",1,2026,6,[]);
  const changed=regenerateCalendarElement(calendar,{calendarEvents:[{id:"e",date:"2026-07-04",title:"Event"}]});
  assert.ok(changed.tableCells?.flat().some((cell)=>cell.includes("Event")));
});

test("Phase 15.8 diagram additions include connectors", () => {
  const base:any[]=[{id:"n1",name:"Root",type:"shape",x:0,y:0,width:100,height:50,rotation:0,zIndex:1,opacity:1,groupId:"g",diagramRole:"node",diagramType:"organization"}];
  let i=0; const next=()=>`id${++i}`;
  const result=addDiagramNode(base,"g",next,"Child");
  assert.ok(result.some((item)=>item.diagramRole==="connector"));
});

test("Phase 15.8 project data registry is auditable", () => {
  const project:any={id:"p",name:"P",createdAt:1,updatedAt:1,activePageId:"pg",autoSave:true,version:2,pages:[{id:"pg",name:"Page",width:1,height:1,sizeKey:"custom",orientation:"portrait",background:"#fff",elements:[]}],dataSourceRegistry:{s:{id:"s",name:"S",type:"csv",headers:[],rows:[],status:"ready",refreshPolicy:"manual",lastRefreshedAt:1}}};
  assert.equal(validateDataSourceRegistry(project)[0].status,"ready");
});
