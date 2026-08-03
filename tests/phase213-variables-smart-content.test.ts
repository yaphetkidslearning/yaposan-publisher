import assert from "node:assert/strict";
import test from "node:test";
import { addCustomVariable, addRunningContentRule, buildVariableMap, insertVariableIntoElements, normalizeDocumentVariables, renderRunningContent, resolveSmartContent, validateDocumentVariables } from "../src/utils/documentVariableEngine";
import type { PublisherProject } from "../src/types/publisher";
const project={id:"p",name:"Annual Report",createdAt:1,updatedAt:1,activePageId:"p1",pages:[{id:"p1",name:"Cover",width:600,height:800,backgroundColor:"#fff",elements:[{id:"t1",type:"text",x:0,y:0,width:100,height:30,text:"Page"}]}]} as unknown as PublisherProject;
test("migrates and resolves system variables",()=>{const p=normalizeDocumentVariables(project);assert.equal(p.phase21Version,"21.3");assert.equal(resolveSmartContent(p,"{{document.title}} {{page.number}}",{pageId:"p1"}),"Annual Report 1");});
test("custom variables insert and resolve",()=>{let p=addCustomVariable(project,"Campaign Name","Summer");const token=p.documentVariables!.variables.find(v=>v.kind==="custom")!.token;p=insertVariableIntoElements(p,token,["t1"]);assert.match(p.pages[0].elements[0].text!,/custom/);assert.equal(resolveSmartContent(p,token),"Summer");});
test("running content renders per page",()=>{const p=addRunningContentRule(project,{name:"Footer",position:"footer",scope:"document",leftTemplate:"{{section.name}}",rightTemplate:"Page {{page.number}} of {{page.total}}",enabled:true});assert.equal(renderRunningContent(p,"p1").footer,"Page 1 of 1");});
test("variable map and validation are stable",()=>{const p=normalizeDocumentVariables(project);assert.equal(buildVariableMap(p,{pageId:"p1"})["{{page.total}}"],"1");assert.equal(validateDocumentVariables(p).length,0);});
