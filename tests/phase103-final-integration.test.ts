import test from "node:test";
import assert from "node:assert/strict";
import { runAiWriting } from "../src/services/aiService";
import { analyzeDocument } from "../src/services/documentIntelligence";
import { applyMergeRecord } from "../src/services/mergeFieldService";
import type { PublisherProject } from "../src/types/publisher";

const project: PublisherProject = {
  id:"final", name:"Phase 10 Final", createdAt:1, updatedAt:1, activePageId:"p1", autoSave:true, version:2,
  mergeData:{variables:{city:"Baltimore"},records:[{id:"r1",name:"Jane",values:{name:"Jane"}}]},
  pages:[{id:"p1",name:"Page 1",width:600,height:800,orientation:"portrait",sizeKey:"custom",backgroundColor:"#fff",margin:20,bleed:0,elements:[
    {id:"t1",name:"Greeting",type:"text",x:20,y:20,width:300,height:80,rotation:0,zIndex:1,opacity:1,text:"Hello {{name}} from {{city}}",fontFamily:"Arial",fontSize:16,textColor:"#111111"}
  ]}]
};

test("AI writer returns usable text for core final actions", async()=>{
  for (const action of ["rewrite","expand","shorten","summarize","grammar","headline","caption","bullets","cta","marketing","social"] as const) {
    const result=await runAiWriting({action,text:"we have a very good community event today"});
    assert.ok(result.trim().length>0, action);
  }
});

test("merge, intelligence, save/export model remain compatible",()=>{
  const merged=applyMergeRecord(project,project.mergeData?.records[0],0);
  assert.equal(merged.pages[0].elements[0].text,"Hello Jane from Baltimore");
  assert.ok(Array.isArray(analyzeDocument(merged)));
  assert.doesNotThrow(()=>JSON.stringify(merged));
  assert.match(JSON.stringify(project),/mergeData/);
});
