import assert from "node:assert/strict";
import test from "node:test";
import { confidenceScore, describeObjects, resolvePromptVariables, restoreRevision } from "../src/services/aiCompletionService";
import type { PublisherProject } from "../src/types/publisher";
const project:PublisherProject={id:"p",name:"Test Project",createdAt:1,updatedAt:1,activePageId:"pg",autoSave:true,version:2,author:"Dawit",pages:[{id:"pg",name:"Page 1",width:100,height:100,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:10,bleed:0,elements:[{id:"t",name:"Text",type:"text",x:0,y:0,width:50,height:20,rotation:0,zIndex:1,opacity:1,text:"Original text"},{id:"i",name:"Image",type:"image",x:0,y:0,width:50,height:20,rotation:0,zIndex:2,opacity:1}]}],mergeData:{variables:{phone:"555-0100"},records:[]}};
test("object awareness counts selected objects",()=>{const x=describeObjects(project.pages[0].elements,"page");assert.equal(x.objectCount,2);assert.equal(x.textCount,1);assert.equal(x.imageCount,1);});
test("prompt variables resolve from project and merge data",()=>assert.equal(resolvePromptVariables("{{ProjectName}} {{Phone}} {{TotalPages}}",project),"Test Project 555-0100 1"));
test("confidence and revision restore work",()=>{assert.ok(confidenceScore("hello world","Hello world.")>70);const next=restoreRevision(project,{id:"r",elementId:"t",pageId:"pg",action:"rewrite",original:"Original text",result:"New text",createdAt:1,confidence:90},true);assert.equal(next.pages[0].elements[0].text,"New text");});
