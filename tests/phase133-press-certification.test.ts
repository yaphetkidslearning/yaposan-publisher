import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import { analyzePressReadiness, buildProductionFingerprint, getPrepressSettings, runPrepress, updatePrepressSettings } from "../src/utils/prepressEngine";

const project: PublisherProject = { id:"p133", name:"Press Job", createdAt:1, updatedAt:2, activePageId:"p1", colorMode:"CMYK", autoSave:false, version:2, pages:[{ id:"p1", name:"Page", width:612, height:792, orientation:"portrait", sizeKey:"letter", backgroundColor:"#fff", margin:36, bleed:9, elements:[
  { id:"t1", name:"Tiny", type:"text", x:20,y:20,width:100,height:20,rotation:0,zIndex:1,opacity:1,text:"Tiny",fontSize:5,textColor:"#000000" },
  { id:"t2", name:"Reverse", type:"text", x:20,y:60,width:100,height:20,rotation:0,zIndex:2,opacity:1,text:"Reverse",fontSize:7,textColor:"#ffffff",fillColor:"#000000" },
  { id:"l1", name:"Hairline", type:"line", x:20,y:100,width:100,height:0,rotation:0,zIndex:3,opacity:1,borderWidth:0.1,borderColor:"#000000" }
]}] };

test("production fingerprint is stable for unchanged jobs", () => assert.equal(buildProductionFingerprint(project), buildProductionFingerprint(project)));
test("production fingerprint changes when job content changes", () => assert.notEqual(buildProductionFingerprint(project), buildProductionFingerprint({...project, updatedAt:3})));
test("press readiness detects small text, reverse text, and hairlines", () => { const s=analyzePressReadiness(project); assert.equal(s.smallTextObjects,1); assert.equal(s.reverseTextObjects,1); assert.equal(s.hairlineObjects,1); });
test("phase 13.3 settings persist", () => { const p=updatePrepressSettings(project,{pressType:"web-offset",substrate:"newsprint",screenFrequency:85,dotGain:25,approvalStatus:"client-approved"}); const s=getPrepressSettings(p); assert.equal(s.pressType,"web-offset"); assert.equal(s.substrate,"newsprint"); assert.equal(s.approvalStatus,"client-approved"); });
test("preflight reports press production risks", () => { const codes=new Set(runPrepress(project).issues.map(i=>i.code)); assert.ok(codes.has("SMALL_TEXT")); assert.ok(codes.has("SMALL_REVERSE_TEXT")); assert.ok(codes.has("HAIRLINE_TOO_THIN")); });
test("press certification requires approval and zero blocking issues", () => { const clean={...project,pages:[{...project.pages[0],elements:[]} ]}; const approved=updatePrepressSettings(clean,{approvalStatus:"press-approved",approvedBy:"Production Manager"}); const report=runPrepress(approved); assert.equal(report.pressReadiness.certified,true); });
