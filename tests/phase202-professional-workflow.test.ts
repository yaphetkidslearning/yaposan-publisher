import test from "node:test";
import assert from "node:assert/strict";
import { addReviewComment, addWorkflowTask, advanceWorkflowStage, buildWorkflowSummary, getCollaborationReviewState, setReviewCommentStatus, setWorkflowPolicy, updateWorkflowTask } from "../src/utils/collaborationReviewEngine";

const project: any = { id: "p", name: "Workflow", updatedAt: 1, activePageId: "page-1", pages: [{ id: "page-1", elements: [] }] };

test("Phase 20.2 migrates review state and manages workflow tasks", () => {
  let state = getCollaborationReviewState(project);
  assert.equal(state.version, "20.2");
  state = addWorkflowTask(state, { title: "Check brand consistency", stageId: "design-review", required: true });
  assert.equal(state.workflow.tasks.length, 1);
  state = updateWorkflowTask(state, state.workflow.tasks[0].id, { status: "complete" });
  assert.equal(state.workflow.tasks[0].status, "complete");
  assert.equal(buildWorkflowSummary(state).progress, 100);
});

test("workflow gates block approval while comments remain open", () => {
  let state = getCollaborationReviewState(project);
  state = setWorkflowPolicy(state, { requirePreflight: false, requireAllTasks: false });
  state = addReviewComment(state, { pageId: "page-1", body: "Fix heading", priority: "high" });
  assert.throws(() => advanceWorkflowStage(state, "approval"), /comment/);
  state = setReviewCommentStatus(state, state.comments[0].id, "resolved");
  state = advanceWorkflowStage(state, "approval", "Ready for final decision");
  assert.equal(state.workflow.currentStage, "approval");
  assert.equal(state.lockedForReview, true);
  assert.equal(state.workflow.handoffs.length, 1);
});

test("workflow supports controlled rollback", () => {
  let state = getCollaborationReviewState(project);
  state = advanceWorkflowStage(state, "content-review");
  state = advanceWorkflowStage(state, "draft", "Copy changes required");
  assert.equal(state.workflow.currentStage, "draft");
  assert.equal(state.workflow.handoffs[0].note, "Copy changes required");
});
