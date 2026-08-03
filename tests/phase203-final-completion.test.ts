import test from "node:test";
import assert from "node:assert/strict";
import { addReviewComment, addWorkflowTask, getCollaborationReviewState, setReviewApproval, setReviewCommentStatus, setWorkflowPolicy, updateWorkflowTask } from "../src/utils/collaborationReviewEngine";
import { archivePhase203Release, buildPhase203Dashboard, buildPhase203Notifications, certifyPhase203Release, getPhase203CompletionState, runPhase203Automation, setPhase203Automation } from "../src/utils/phase203CompletionEngine";

const project: any = { id: "p20.3", name: "Final Completion", updatedAt: 100, activePageId: "page-1", pages: [{ id: "page-1", elements: [{ id: "e1" }] }] };

test("Phase 20.3 migrates and runs stage automation without duplicate checklist tasks", () => {
  let state = getCollaborationReviewState(project);
  state = runPhase203Automation(state);
  const firstCount = state.workflow.tasks.length;
  assert.ok(firstCount >= 2);
  state = runPhase203Automation(state);
  assert.equal(state.workflow.tasks.length, firstCount);
  assert.equal(getPhase203CompletionState(state).version, "20.3");
});

test("completion notifications identify urgent and blocked work", () => {
  let state = getCollaborationReviewState(project);
  state = addReviewComment(state, { pageId: "page-1", body: "Critical correction", priority: "urgent" });
  state = addWorkflowTask(state, { title: "Blocked production task" });
  state = updateWorkflowTask(state, state.workflow.tasks[0].id, { status: "blocked" });
  const notifications = buildPhase203Notifications(state);
  assert.ok(notifications.some((item) => item.id === "urgent-comments"));
  assert.ok(notifications.some((item) => item.id === "blocked-tasks"));
});

test("certification enforces gates and creates an auditable release record", () => {
  let state = getCollaborationReviewState(project);
  state = setWorkflowPolicy(state, { requirePreflight: false, requireAllTasks: false });
  state = addReviewComment(state, { pageId: "page-1", body: "Resolve before release", priority: "normal" });
  assert.throws(() => certifyPhase203Release(project, state, "Release 1"), /comment/);
  state = setReviewCommentStatus(state, state.comments[0].id, "resolved");
  state = setReviewApproval(state, "local-owner", "approved", "Approved");
  state = certifyPhase203Release(project, state, "Release 1");
  const completion = getPhase203CompletionState(state);
  assert.equal(completion.releases.length, 1);
  assert.match(completion.releases[0].certificateNumber, /^YP-20\.3-/);
  assert.equal(state.workflow.currentStage, "released");
  assert.equal(state.lockedForReview, true);
  assert.equal(buildPhase203Dashboard(project, state).releaseCount, 1);
  state = archivePhase203Release(state, completion.releases[0].id);
  assert.ok(getPhase203CompletionState(state).releases[0].archivedAt);
});

test("certification lock policy can be disabled", () => {
  let state = getCollaborationReviewState(project);
  state = setWorkflowPolicy(state, { requirePreflight: false, requireAllTasks: false });
  state = setPhase203Automation(state, { lockCertifiedRelease: false });
  state = certifyPhase203Release(project, state, "Unlocked release");
  assert.equal(state.lockedForReview, false);
});
