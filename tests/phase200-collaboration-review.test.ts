import assert from "node:assert/strict";
import test from "node:test";
import { addReviewComment, addReviewMember, buildReviewSummary, createReviewSnapshot, exportReviewReport, getCollaborationReviewState, setReviewApproval, setReviewCommentStatus } from "../src/utils/collaborationReviewEngine";

const project:any={id:"p1",name:"Publication",updatedAt:1,activePageId:"page-1",pages:[{id:"page-1",elements:[{id:"e1"}]}]};
test("Phase 20 creates members, comments, resolution and approvals",()=>{
 let state=getCollaborationReviewState(project);
 state=addReviewMember(state,{name:"Reviewer",email:"review@example.com",role:"commenter"});
 state=addReviewComment(state,{pageId:"page-1",elementId:"e1",body:"Increase contrast",priority:"high"});
 assert.equal(state.members.length,2); assert.equal(buildReviewSummary(state).openComments,1);
 state=setReviewCommentStatus(state,state.comments[0].id,"resolved");
 state=setReviewApproval(state,"local-owner","approved");
 const summary=buildReviewSummary(state); assert.equal(summary.resolvedComments,1); assert.equal(summary.approved,1); assert.equal(summary.readyForRelease,true);
});
test("Phase 20 snapshots and exports deterministic review data",()=>{
 let state=getCollaborationReviewState(project); state=createReviewSnapshot(project,state,"Preflight review");
 assert.equal(state.snapshots[0].elementCount,1);
 const report=JSON.parse(exportReviewReport(project,state)); assert.equal(report.schema,"yaposan.phase20.review-report"); assert.equal(report.snapshots[0].label,"Preflight review");
});
