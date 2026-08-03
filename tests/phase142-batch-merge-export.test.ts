import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherProject } from "../src/types/publisher";
import { buildDataSource } from "../src/utils/mailMergeEngine";
import { buildMergedProjects, getBatchRecords, DEFAULT_MERGE_BATCH_SETTINGS } from "../src/utils/mailMergeBatchEngine";

const source=buildDataSource("Recipients","csv",[{name:"Alice",amount:"12"},{name:"Bob",amount:"20"},{name:"Bob",amount:"20"}]);
const project:PublisherProject={id:"p",name:"Certificate",createdAt:1,updatedAt:1,version:2,autoSave:true,activePageId:"page",pages:[{id:"page",name:"Page 1",width:600,height:400,orientation:"landscape",sizeKey:"custom",backgroundColor:"#fff",margin:24,bleed:0,elements:[{id:"text",type:"text",name:"Name",x:0,y:0,width:200,height:40,rotation:0,zIndex:1,opacity:1,locked:false,hidden:false,text:"Awarded to {{name}}",fontFamily:"Arial",fontSize:20,fontWeight:"400",textAlign:"left",lineHeight:1.2,letterSpacing:0,textColor:"#000"}]}],mailMergeData:{sources:[source],activeSourceId:source.id}};
test("excludes duplicates by default",()=>assert.equal(getBatchRecords(project.mailMergeData!,false).length,2));
test("builds one resolved publication per record",()=>{const out=buildMergedProjects(project,DEFAULT_MERGE_BATCH_SETTINGS);assert.equal(out.length,2);assert.equal(out[0].pages[0].elements[0].text,"Awarded to Alice");assert.equal(out[1].pages[0].elements[0].text,"Awarded to Bob")});
test("combined mode sequences all record pages",()=>{const out=buildMergedProjects(project,{...DEFAULT_MERGE_BATCH_SETTINGS,mode:"combined"});assert.equal(out.length,1);assert.equal(out[0].pages.length,2);assert.match(out[0].pages[1].name,/Bob/)});
