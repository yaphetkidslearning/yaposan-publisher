import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherElement, PublisherProject } from "../src/types/publisher";
import { auditPhase15Element, auditPhase15Project, duplicatePhase15Elements, exportPhase15Data, generateAccessibilityLabel, normalizePhase15Element } from "../src/utils/phase15CompletionEngine";

const table: PublisherElement = { id:"table-1", name:"Sales Table", type:"table", x:10,y:10,width:500,height:220,rotation:0,zIndex:1,opacity:1,tableRows:3,tableColumns:2,tableCells:[["Region","Sales"],["East","120"],["West","150"]],dataObjectKind:"linked-table" };

test("generates accessibility labels and normalizes professional objects", () => {
  assert.match(generateAccessibilityLabel(table), /3 rows by 2 columns/);
  const normalized = normalizePhase15Element({ ...table, width: 2, opacity: 2 });
  assert.equal(normalized.width, 24);
  assert.equal(normalized.opacity, 1);
  assert.ok(normalized.accessibilityLabel);
});

test("audits broken and healthy Phase 15 objects", () => {
  assert.equal(auditPhase15Element(normalizePhase15Element(table)).filter(i=>i.severity==="error").length, 0);
  const broken = { ...table, tableCells: [], width: 1, accessibilityLabel: "" };
  assert.ok(auditPhase15Element(broken).filter(i=>i.severity==="error").length >= 2);
});

test("duplicates grouped objects while preserving editability", () => {
  let n=0; const copies=duplicatePhase15Elements([{...table,groupId:"g1"},{...table,id:"table-2",groupId:"g1"}],()=>`copy-${++n}`);
  assert.equal(copies.length,2); assert.equal(copies[0].groupId,copies[1].groupId); assert.notEqual(copies[0].id,table.id);
});

test("exports retained visualization data and audits a project", () => {
  const exported=JSON.parse(exportPhase15Data(table)); assert.equal(exported.element.id,"table-1"); assert.equal(exported.sourceData.length,3);
  const project: PublisherProject={id:"p",name:"Phase 15",createdAt:1,updatedAt:1,pages:[{id:"page",name:"Page",width:1000,height:1000,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:24,bleed:0,elements:[normalizePhase15Element(table)]}],activePageId:"page",autoSave:true,version:2};
  const report=auditPhase15Project(project); assert.equal(report.errors,0); assert.ok(report.score>=95);
});
