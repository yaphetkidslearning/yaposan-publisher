import test from "node:test";
import assert from "node:assert/strict";
import type { PublisherProject } from "../src/types/publisher";
import { addDocumentSection, buildPageNumberMap, calculateDocumentStatistics, deleteDocumentSection, formatPageNumber, moveDocumentSection, movePageToSection, normalizeDocumentFoundation, searchDocument, updateDocumentSection, updateDocumentSettings } from "../src/utils/documentFoundationEngine";

const project = (): PublisherProject => ({ id:"p1",name:"Annual Report",createdAt:1,updatedAt:1,activePageId:"p1",autoSave:true,version:2,pages:[
  {id:"p1",name:"Cover",width:800,height:1000,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:36,bleed:0,elements:[]},
  {id:"p2",name:"Chapter One",width:800,height:1000,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:36,bleed:0,elements:[{id:"e1",type:"text",name:"Heading",x:0,y:0,width:100,height:20,rotation:0,zIndex:0,opacity:1,locked:false,hidden:false,text:"Introduction to Yaposan",fontFamily:"Arial",fontSize:20,textColor:"#000"}]},
  {id:"p3",name:"Appendix",width:800,height:1000,orientation:"portrait",sizeKey:"letter",backgroundColor:"#fff",margin:36,bleed:0,elements:[]}
]});

test("migrates Phase 20 project into one complete section",()=>{const p=normalizeDocumentFoundation(project());assert.equal(p.phase21Version,"21.0");assert.equal(p.documentFoundation?.sections[0].pageIds.length,3);});
test("creates sections and moves pages without duplication",()=>{let p=addDocumentSection(project(),"Appendix");const id=p.documentFoundation!.sections[1].id;p=movePageToSection(p,"p3",id);assert.deepEqual(p.documentFoundation!.sections[1].pageIds,["p3"]);assert.equal(new Set(p.documentFoundation!.sections.flatMap(s=>s.pageIds)).size,3);});
test("supports professional numbering and facing page sides",()=>{let p=normalizeDocumentFoundation(project());const id=p.documentFoundation!.sections[0].id;p=updateDocumentSection(p,id,{numbering:{style:"roman-lower",startAt:3,prefix:"FM-",continueFromPrevious:false}});p=updateDocumentSettings(p,{viewMode:"facing"});const map=buildPageNumberMap(p);assert.equal(map[0].display,"FM-iii");assert.equal(map[0].side,"right");assert.equal(map[1].side,"left");assert.equal(formatPageNumber(27,"letters-upper"),"AA");});
test("moves and deletes sections while preserving pages",()=>{let p=addDocumentSection(project(),"Second");const id=p.documentFoundation!.sections[1].id;p=movePageToSection(p,"p3",id);p=moveDocumentSection(p,id,-1);assert.equal(p.pages[0].id,"p3");p=deleteDocumentSection(p,id);assert.equal(p.documentFoundation!.sections.length,1);assert.equal(p.documentFoundation!.sections[0].pageIds.length,3);});
test("calculates statistics and searches publication content",()=>{const p=normalizeDocumentFoundation(project());const stats=calculateDocumentStatistics(p);assert.equal(stats.pages,3);assert.equal(stats.words,3);const results=searchDocument(p,"Introduction");assert.equal(results[0].elementId,"e1");});
