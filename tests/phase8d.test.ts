import test from "node:test";
import assert from "node:assert/strict";
import { analyzeProjectIntegrity, deduplicateProjectAssets, repairProjectIntegrity } from "../src/utils/projectPhase8DManager";
import { createStoredZip } from "../src/utils/zipStore";
import type { PublisherProject } from "../src/types/publisher";

const project: PublisherProject = {
  id:"p1", name:"Audit", createdAt:1, updatedAt:1, activePageId:"missing", autoSave:true, version:2,
  pages:[{id:"page1",name:"Page 1",width:816,height:1056,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:36,bleed:12,elements:[
    {id:"same",name:"SVG 1",type:"svg",x:0,y:0,width:100,height:100,rotation:0,zIndex:1,opacity:1,svgMarkup:"<svg><path/></svg>",imageUri:"data:image/svg+xml,duplicate"},
    {id:"same",name:"SVG 2",type:"svg",x:Number.NaN,y:0,width:-1,height:100,rotation:0,zIndex:2,opacity:1,svgMarkup:"<svg><path/></svg>",imageUri:"data:image/svg+xml,duplicate"},
  ]}]
};

test("integrity analysis detects broken references, duplicate IDs and geometry",()=>{
 const report=analyzeProjectIntegrity(project);
 assert.ok(report.issues.some(i=>i.kind==="active-page"));
 assert.ok(report.issues.some(i=>i.kind==="duplicate-id"));
 assert.ok(report.issues.some(i=>i.kind==="geometry"));
 assert.equal(report.duplicateAssets,1);
});

test("integrity repair creates valid unique IDs and active page",()=>{
 const fixed=repairProjectIntegrity(project);
 assert.equal(fixed.activePageId,"page1");
 assert.equal(new Set(fixed.pages[0].elements.map(e=>e.id)).size,2);
 assert.ok(fixed.pages[0].elements.every(e=>e.width>0&&e.height>0&&Number.isFinite(e.x)));
});

test("asset compaction removes redundant SVG fallback data",()=>{
 const result=deduplicateProjectAssets(project);
 assert.equal(result.duplicates,1);
 assert.ok(result.bytesSaved>0);
 assert.equal(result.project.pages[0].elements[1].imageUri,undefined);
});

test("batch ZIP writer emits standard ZIP signatures",()=>{
 const zip=createStoredZip([{name:"a.txt",contents:"hello"},{name:"b.txt",contents:"world"}]);
 assert.deepEqual(Array.from(zip.slice(0,4)),[0x50,0x4b,0x03,0x04]);
 assert.ok(zip.some((_,i)=>zip[i]===0x50&&zip[i+1]===0x4b&&zip[i+2]===0x05&&zip[i+3]===0x06));
});
