import test from "node:test";
import assert from "node:assert/strict";
import { addAnnotation, addBookmark, addFormField, createPdfStudioDocument, deletePages, reorderPage, rotatePage, validatePdf } from "../src/utils/professionalPdfStudioEngine";

test("Phase 25.0 PDF Studio document operations are immutable and production structured",()=>{
 const base=createPdfStudioDocument("Production.pdf");
 const seeded={...base,pages:[{id:"p1",sourceIndex:0,rotation:0 as const,selected:false,label:"Page 1",width:612,height:792},{id:"p2",sourceIndex:1,rotation:0 as const,selected:false,label:"Page 2",width:612,height:792}]};
 const rotated=rotatePage(seeded,"p1",90); assert.equal(rotated.pages[0].rotation,90); assert.equal(seeded.pages[0].rotation,0);
 const reordered=reorderPage(rotated,"p2",0); assert.equal(reordered.pages[0].id,"p2");
 const annotated=addAnnotation(reordered,{pageId:"p1",kind:"highlight",x:10,y:10,width:100,height:20}); assert.equal(annotated.annotations.length,1);
 const formed=addFormField(annotated,{pageId:"p1",kind:"text",name:"customer_name",x:10,y:40,width:180,height:24,required:true}); assert.equal(formed.fields.length,1);
 const bookmarked=addBookmark(formed,"Start","p1"); assert.equal(bookmarked.bookmarks.length,1);
 const deleted=deletePages(bookmarked,["p1"]); assert.equal(deleted.pages.length,1); assert.equal(deleted.annotations.length,0); assert.equal(deleted.fields.length,0);
});

test("Phase 25.0 validation covers standards and accessibility readiness",()=>{
 const doc=createPdfStudioDocument("Accessible.pdf");
 const audit=validatePdf(doc); assert.equal(audit.valid,false); assert.ok(audit.issues.includes("Document has no pages"));
});
