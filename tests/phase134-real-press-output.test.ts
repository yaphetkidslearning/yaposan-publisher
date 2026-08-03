import test from "node:test";
import assert from "node:assert/strict";
import { buildProductionOutputPlan, fnv1a, productionOutputSummary, validatePdfXReadiness } from "../src/utils/productionOutputEngine";
import { updatePrepressSettings } from "../src/utils/prepressEngine";
import type { PublisherProject } from "../src/types/publisher";

const project: PublisherProject = { id:"p", name:"Press Job", author:"QA", createdAt:1, updatedAt:1, version:2, autoSave:false, activePageId:"a", pages:[{id:"a",name:"Page 1",width:612,height:792,orientation:"portrait",sizeKey:"letter",margin:36,backgroundColor:"#fff",bleed:9,elements:[]}]} as PublisherProject;

test("phase 13.4 creates composite production artifact",()=>{ const p=updatePrepressSettings(project,{pdfStandard:"PDF",generateSeparations:false}); const plan=buildProductionOutputPlan(p); assert.ok(plan.artifacts.some(a=>a.kind==="composite")); assert.ok(plan.artifacts.some(a=>a.path==="manifest.json")); });
test("phase 13.4 creates process separations",()=>{ const p=updatePrepressSettings(project,{pdfStandard:"PDF",generateSeparations:true}); const plan=buildProductionOutputPlan(p); assert.ok(plan.artifacts.filter(a=>a.kind==="separation").length>=4); });
test("phase 13.4 creates finishing plates",()=>{ const p=updatePrepressSettings(project,{pdfStandard:"PDF",finishingOperations:["die-cut","foil"]}); const plan=buildProductionOutputPlan(p); assert.equal(plan.artifacts.filter(a=>a.kind==="finishing").length,2); });
test("PDF/X-1a readiness requires flattening",()=>{ const p=updatePrepressSettings(project,{pdfStandard:"PDF/X-1a",flattenTransparency:false,approvalStatus:"press-approved",approvedBy:"QA"}); assert.equal(validatePdfXReadiness(p).compliant,false); });
test("checksums are stable",()=>{ assert.equal(fnv1a("Yaposan"),fnv1a("Yaposan")); assert.notEqual(fnv1a("Yaposan"),fnv1a("Yaposan!")); });
test("production summary reports package contents",()=>{ const p=updatePrepressSettings(project,{pdfStandard:"PDF",generateSeparations:false}); const summary=productionOutputSummary(buildProductionOutputPlan(p)); assert.ok(summary.artifactCount>=6); assert.equal(summary.pdfxReady,true); });
