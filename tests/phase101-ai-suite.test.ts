import assert from "node:assert/strict";
import test from "node:test";
import { runAiWriting } from "../src/services/aiService";
import { analyzeDocument } from "../src/services/documentIntelligence";
import type { PublisherProject } from "../src/types/publisher";

test("translation, marketing and social generators return usable content", async () => {
  assert.match(await runAiWriting({action:"translate",text:"Hello community",targetLanguage:"Spanish"}), /Hola comunidad/i);
  assert.match(await runAiWriting({action:"marketing",prompt:"summer community sale"}), /benefits|quality/i);
  assert.match(await runAiWriting({action:"social",prompt:"Join our event today"}), /#Yaposan/);
});

test("document intelligence detects empty, duplicate, overflow, bounds and accessibility issues", () => {
  const project={id:"p",name:"Test",createdAt:1,updatedAt:1,activePageId:"page",autoSave:true,version:2,pages:[{id:"page",name:"Page 1",width:500,height:500,backgroundColor:"#fff",elements:[
    {id:"a",name:"Empty",type:"text",x:0,y:0,width:100,height:20,rotation:0,zIndex:1,opacity:1,text:"",fontSize:10,textColor:"#eeeeee",fillColor:"#ffffff"},
    {id:"b",name:"Copy",type:"text",x:10,y:20,width:80,height:10,rotation:0,zIndex:2,opacity:1,text:"This duplicated sentence is deliberately long.",fontSize:20,textColor:"#000",fillColor:"transparent"},
    {id:"c",name:"Copy 2",type:"text",x:450,y:450,width:100,height:100,rotation:0,zIndex:3,opacity:1,text:"This duplicated sentence is deliberately long.",fontSize:20,textColor:"#000",fillColor:"transparent"},
    {id:"img",name:"Photo",type:"image",x:20,y:20,width:100,height:100,rotation:0,zIndex:4,opacity:1,fillColor:"transparent"}
  ]}]} as unknown as PublisherProject;
  const kinds=new Set(analyzeDocument(project).map(x=>x.kind));
  for(const expected of ["empty","duplicate","overflow","layout","accessibility"]) assert.equal(kinds.has(expected as any),true);
});
