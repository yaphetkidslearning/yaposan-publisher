import assert from "node:assert/strict";
import test from "node:test";
import { addReviewComment, addReviewMember, buildReviewSummary, exportReviewReport, filterReviewComments, getCollaborationReviewState, importReviewReport, replyToReviewComment, setReviewApproval, setReviewPolicy, updateReviewComment, updateReviewMember } from "../src/utils/collaborationReviewEngine";

const project:any={id:"p20",name:"Phase 20.1",updatedAt:10,activePageId:"page-1",pages:[{id:"page-1",elements:[{id:"e1"}]},{id:"page-2",elements:[]}]};

test("Phase 20.1 activates assignments, replies and filters",()=>{
 let state=getCollaborationReviewState(project);
 state=addReviewMember(state,{name:"Editor",email:"EDITOR@example.com",role:"editor"});
 const editor=state.members.find(member=>member.role==="editor")!;
 state=addReviewComment(state,{pageId:"page-1",elementId:"e1",body:"Fix this object",priority:"urgent",assigneeId:editor.id,dueAt:Date.now()-1000});
 state=replyToReviewComment(state,state.comments[0].id,"Working on it",editor.id);
 assert.equal(filterReviewComments(state,{scope:"selection",pageId:"page-1",elementId:"e1",status:"open",query:"working"}).length,1);
 const summary=buildReviewSummary(state);
 assert.equal(summary.overdueComments,1);
 assert.equal(state.comments[0].replies.length,1);
});

test("Phase 20.1 enforces approval policy and reviewer lifecycle",()=>{
 let state=getCollaborationReviewState(project);
 state=addReviewMember(state,{name:"Editor",role:"editor"});
 const editor=state.members.find(member=>member.role==="editor")!;
 state=setReviewPolicy(state,{approvalRequired:true,lockedForReview:true});
 state=setReviewApproval(state,"local-owner","approved");
 assert.equal(buildReviewSummary(state).readyForRelease,false);
 state=setReviewApproval(state,editor.id,"approved");
 assert.equal(buildReviewSummary(state).readyForRelease,true);
 state=updateReviewMember(state,editor.id,{active:false});
 assert.equal(state.members.find(member=>member.id===editor.id)?.active,false);
});

test("Phase 20.1 report round-trip preserves advanced review state",()=>{
 let state=getCollaborationReviewState(project);
 state=addReviewComment(state,{pageId:"page-2",body:"Page review",priority:"normal"});
 state=updateReviewComment(state,state.comments[0].id,{priority:"high"});
 const report=exportReviewReport(project,state);
 const parsed=JSON.parse(report);
 assert.equal(parsed.version,2);
 assert.equal(parsed.phase,"20.1");
 const imported=importReviewReport(getCollaborationReviewState(project),report);
 assert.equal(imported.comments[0].priority,"high");
 assert.equal(imported.activity[0].action,"Imported a review report");
});
