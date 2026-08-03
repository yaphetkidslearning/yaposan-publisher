import type { PublisherProject } from "../types/publisher";

export type ReviewRole = "owner" | "editor" | "commenter" | "viewer";
export type ReviewStatus = "open" | "resolved" | "reopened";
export type ApprovalDecision = "pending" | "approved" | "changes-requested";
export type ReviewPriority = "low" | "normal" | "high" | "urgent";
export type ReviewScope = "all" | "page" | "selection";

export type ReviewMember = { id: string; name: string; email?: string; role: ReviewRole; active: boolean; addedAt: number };
export type ReviewReply = { id: string; authorId: string; body: string; createdAt: number; editedAt?: number };
export type ReviewComment = {
  id: string; pageId: string; elementId?: string; authorId: string; body: string; createdAt: number; updatedAt: number;
  status: ReviewStatus; priority: ReviewPriority; assigneeId?: string; dueAt?: number; replies: ReviewReply[];
};
export type ReviewApproval = { id: string; reviewerId: string; decision: ApprovalDecision; note?: string; updatedAt: number };
export type ReviewActivity = { id: string; actorId: string; action: string; targetId?: string; createdAt: number };
export type ReviewSnapshot = { id: string; label: string; createdAt: number; projectUpdatedAt: number; pageCount: number; elementCount: number; openComments: number };
export type WorkflowStageId = "draft" | "content-review" | "design-review" | "preflight" | "approval" | "released";
export type WorkflowTaskStatus = "pending" | "in-progress" | "blocked" | "complete";
export type WorkflowTask = { id: string; title: string; stageId: WorkflowStageId; status: WorkflowTaskStatus; assigneeId?: string; dueAt?: number; required: boolean; createdAt: number; completedAt?: number };
export type WorkflowHandoff = { id: string; fromStage: WorkflowStageId; toStage: WorkflowStageId; actorId: string; note?: string; createdAt: number };
export type WorkflowSettings = { currentStage: WorkflowStageId; autoLockOnApproval: boolean; requirePreflight: boolean; requireAllTasks: boolean; stageStartedAt: number; tasks: WorkflowTask[]; handoffs: WorkflowHandoff[] };
export type CollaborationReviewState = {
  version: "20.2"; members: ReviewMember[]; comments: ReviewComment[]; approvals: ReviewApproval[]; activity: ReviewActivity[];
  snapshots: ReviewSnapshot[]; approvalRequired: boolean; lockedForReview: boolean; workflow: WorkflowSettings;
};

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const DEFAULT_REVIEW_OWNER: ReviewMember = { id: "local-owner", name: "Project Owner", role: "owner", active: true, addedAt: 0 };

export function getCollaborationReviewState(project: PublisherProject): CollaborationReviewState {
  const stored = (project as PublisherProject & { collaborationReview?: Partial<CollaborationReviewState> }).collaborationReview;
  return {
    version: "20.2",
    members: stored?.members?.length ? stored.members : [DEFAULT_REVIEW_OWNER],
    comments: stored?.comments ?? [], approvals: stored?.approvals ?? [], activity: stored?.activity ?? [], snapshots: stored?.snapshots ?? [],
    approvalRequired: stored?.approvalRequired ?? false, lockedForReview: stored?.lockedForReview ?? false,
    workflow: stored?.workflow ?? { currentStage: "draft", autoLockOnApproval: true, requirePreflight: true, requireAllTasks: true, stageStartedAt: Date.now(), tasks: [], handoffs: [] },
  };
}
export function withReviewState(project: PublisherProject, state: CollaborationReviewState): PublisherProject {
  return { ...project, collaborationReview: state, phase20Version: "20.4", updatedAt: Date.now() } as PublisherProject;
}
const activity = (actorId: string, action: string, targetId?: string): ReviewActivity => ({ id: id("activity"), actorId, action, targetId, createdAt: Date.now() });

export function addReviewMember(state: CollaborationReviewState, member: Omit<ReviewMember, "id" | "addedAt" | "active">, actorId = "local-owner"): CollaborationReviewState {
  const email = member.email?.trim().toLowerCase();
  if (!member.name.trim() || (email && state.members.some((item) => item.email?.toLowerCase() === email))) return state;
  const next = { ...member, name: member.name.trim(), email, id: id("member"), active: true, addedAt: Date.now() };
  return { ...state, members: [...state.members, next], activity: [activity(actorId, `Added ${next.name} as ${next.role}`, next.id), ...state.activity] };
}
export function updateReviewMember(state: CollaborationReviewState, memberId: string, updates: Partial<Pick<ReviewMember, "name" | "email" | "role" | "active">>, actorId = "local-owner"): CollaborationReviewState {
  const current = state.members.find((item) => item.id === memberId); if (!current || current.role === "owner" && updates.active === false) return state;
  const members = state.members.map((item) => item.id === memberId ? { ...item, ...updates, name: updates.name?.trim() || item.name, email: updates.email?.trim().toLowerCase() || item.email } : item);
  return { ...state, members, activity: [activity(actorId, `Updated reviewer ${current.name}`, memberId), ...state.activity] };
}
export function addReviewComment(state: CollaborationReviewState, input: Pick<ReviewComment, "pageId" | "elementId" | "body" | "priority" | "assigneeId" | "dueAt"> & { authorId?: string }): CollaborationReviewState {
  const authorId = input.authorId ?? "local-owner"; const now = Date.now();
  const comment: ReviewComment = { id: id("comment"), pageId: input.pageId, elementId: input.elementId, authorId, body: input.body.trim(), priority: input.priority, assigneeId: input.assigneeId, dueAt: input.dueAt, createdAt: now, updatedAt: now, status: "open", replies: [] };
  if (!comment.body) return state;
  return { ...state, comments: [comment, ...state.comments], activity: [activity(authorId, "Added a review comment", comment.id), ...state.activity] };
}
export function updateReviewComment(state: CollaborationReviewState, commentId: string, updates: Partial<Pick<ReviewComment, "body" | "priority" | "assigneeId" | "dueAt">>, actorId = "local-owner"): CollaborationReviewState {
  if (updates.body !== undefined && !updates.body.trim()) return state;
  const comments = state.comments.map((item) => item.id === commentId ? { ...item, ...updates, body: updates.body?.trim() ?? item.body, updatedAt: Date.now() } : item);
  return { ...state, comments, activity: [activity(actorId, "Updated a review comment", commentId), ...state.activity] };
}
export function replyToReviewComment(state: CollaborationReviewState, commentId: string, body: string, authorId = "local-owner"): CollaborationReviewState {
  if (!body.trim()) return state; const reply: ReviewReply = { id: id("reply"), authorId, body: body.trim(), createdAt: Date.now() };
  return { ...state, comments: state.comments.map(c => c.id === commentId ? { ...c, replies: [...c.replies, reply], updatedAt: Date.now() } : c), activity: [activity(authorId, "Replied to a review comment", commentId), ...state.activity] };
}
export function setReviewCommentStatus(state: CollaborationReviewState, commentId: string, status: ReviewStatus, actorId = "local-owner"): CollaborationReviewState {
  return { ...state, comments: state.comments.map(c => c.id === commentId ? { ...c, status, updatedAt: Date.now() } : c), activity: [activity(actorId, `${status === "resolved" ? "Resolved" : "Reopened"} a review comment`, commentId), ...state.activity] };
}
export function setReviewApproval(state: CollaborationReviewState, reviewerId: string, decision: ApprovalDecision, note?: string): CollaborationReviewState {
  const current = state.approvals.find(a => a.reviewerId === reviewerId); const next: ReviewApproval = { id: current?.id ?? id("approval"), reviewerId, decision, note: note?.trim(), updatedAt: Date.now() };
  return { ...state, approvals: [...state.approvals.filter(a => a.reviewerId !== reviewerId), next], activity: [activity(reviewerId, decision === "approved" ? "Approved the publication" : decision === "changes-requested" ? "Requested changes" : "Reset approval", next.id), ...state.activity] };
}
export function setReviewPolicy(state: CollaborationReviewState, updates: Partial<Pick<CollaborationReviewState, "approvalRequired" | "lockedForReview">>, actorId = "local-owner"): CollaborationReviewState {
  return { ...state, ...updates, activity: [activity(actorId, updates.lockedForReview !== undefined ? (updates.lockedForReview ? "Locked publication for review" : "Unlocked publication for editing") : "Updated approval policy"), ...state.activity] };
}
export function createReviewSnapshot(project: PublisherProject, state: CollaborationReviewState, label: string, actorId = "local-owner"): CollaborationReviewState {
  const snapshot: ReviewSnapshot = { id: id("snapshot"), label: label.trim() || `Review snapshot ${state.snapshots.length + 1}`, createdAt: Date.now(), projectUpdatedAt: project.updatedAt, pageCount: project.pages.length, elementCount: project.pages.reduce((n,p)=>n+p.elements.length,0), openComments: state.comments.filter(c=>c.status!=="resolved").length };
  return { ...state, snapshots: [snapshot, ...state.snapshots].slice(0, 50), activity: [activity(actorId, `Created snapshot “${snapshot.label}”`, snapshot.id), ...state.activity] };
}
export function filterReviewComments(state: CollaborationReviewState, options: { scope?: ReviewScope; pageId?: string; elementId?: string; status?: "all" | ReviewStatus; priority?: "all" | ReviewPriority; assigneeId?: "all" | "unassigned" | string; query?: string }) {
  const query = options.query?.trim().toLowerCase();
  return state.comments.filter((comment) => {
    if (options.scope === "page" && comment.pageId !== options.pageId) return false;
    if (options.scope === "selection" && (!options.elementId || comment.elementId !== options.elementId)) return false;
    if (options.status && options.status !== "all" && comment.status !== options.status) return false;
    if (options.priority && options.priority !== "all" && comment.priority !== options.priority) return false;
    if (options.assigneeId === "unassigned" && comment.assigneeId) return false;
    if (options.assigneeId && options.assigneeId !== "all" && options.assigneeId !== "unassigned" && comment.assigneeId !== options.assigneeId) return false;
    return !query || comment.body.toLowerCase().includes(query) || comment.replies.some((reply) => reply.body.toLowerCase().includes(query));
  });
}
export function buildReviewSummary(state: CollaborationReviewState) {
  const open = state.comments.filter(c=>c.status!=="resolved"); const approved = state.approvals.filter(a=>a.decision==="approved").length; const changes = state.approvals.filter(a=>a.decision==="changes-requested").length;
  const overdue = open.filter((comment) => Boolean(comment.dueAt && comment.dueAt < Date.now())).length;
  const requiredReviewers = state.members.filter((member) => member.active && (member.role === "owner" || member.role === "editor"));
  const allRequiredApproved = requiredReviewers.length > 0 && requiredReviewers.every((member) => state.approvals.some((approval) => approval.reviewerId === member.id && approval.decision === "approved"));
  return { totalComments: state.comments.length, openComments: open.length, resolvedComments: state.comments.length-open.length, urgentComments: open.filter(c=>c.priority==="urgent").length, overdueComments: overdue, activeMembers: state.members.filter(m=>m.active).length, approved, changesRequested: changes, readyForRelease: open.length===0 && changes===0 && (!state.approvalRequired || allRequiredApproved) };
}
export function exportReviewReport(project: PublisherProject, state: CollaborationReviewState): string {
  return JSON.stringify({ schema: "yaposan.phase20.review-report", version: 2, phase: "20.1", project: { id: project.id, name: project.name, updatedAt: project.updatedAt }, generatedAt: Date.now(), summary: buildReviewSummary(state), policy: { approvalRequired: state.approvalRequired, lockedForReview: state.lockedForReview }, members: state.members, comments: state.comments, approvals: state.approvals, snapshots: state.snapshots, activity: state.activity }, null, 2);
}
export function importReviewReport(state: CollaborationReviewState, source: string, actorId = "local-owner"): CollaborationReviewState {
  const parsed = JSON.parse(source) as { schema?: string; members?: ReviewMember[]; comments?: ReviewComment[]; approvals?: ReviewApproval[]; snapshots?: ReviewSnapshot[]; policy?: { approvalRequired?: boolean; lockedForReview?: boolean } };
  if (parsed.schema !== "yaposan.phase20.review-report") throw new Error("Unsupported Yaposan review report.");
  return { ...state, members: parsed.members?.length ? parsed.members : state.members, comments: parsed.comments ?? state.comments, approvals: parsed.approvals ?? state.approvals, snapshots: parsed.snapshots ?? state.snapshots, approvalRequired: parsed.policy?.approvalRequired ?? state.approvalRequired, lockedForReview: parsed.policy?.lockedForReview ?? state.lockedForReview, activity: [activity(actorId, "Imported a review report"), ...state.activity] };
}


export const WORKFLOW_STAGES: { id: WorkflowStageId; label: string; description: string }[] = [
  { id: "draft", label: "Draft", description: "Authoring and internal preparation" },
  { id: "content-review", label: "Content Review", description: "Copy, data, and messaging review" },
  { id: "design-review", label: "Design Review", description: "Layout, brand, accessibility, and visual review" },
  { id: "preflight", label: "Preflight", description: "Production, links, assets, and output checks" },
  { id: "approval", label: "Approval", description: "Final stakeholder decision" },
  { id: "released", label: "Released", description: "Approved production version" },
];

export function addWorkflowTask(state: CollaborationReviewState, input: { title: string; stageId?: WorkflowStageId; assigneeId?: string; dueAt?: number; required?: boolean }, actorId = "local-owner"): CollaborationReviewState {
  const title = input.title.trim();
  if (!title) return state;
  const task: WorkflowTask = { id: id("task"), title, stageId: input.stageId ?? state.workflow.currentStage, status: "pending", assigneeId: input.assigneeId, dueAt: input.dueAt, required: input.required ?? true, createdAt: Date.now() };
  return { ...state, workflow: { ...state.workflow, tasks: [task, ...state.workflow.tasks] }, activity: [activity(actorId, `Created workflow task “${title}”`, task.id), ...state.activity] };
}

export function updateWorkflowTask(state: CollaborationReviewState, taskId: string, updates: Partial<Pick<WorkflowTask, "title" | "status" | "assigneeId" | "dueAt" | "required">>, actorId = "local-owner"): CollaborationReviewState {
  const current = state.workflow.tasks.find((task) => task.id === taskId);
  if (!current) return state;
  const now = Date.now();
  const tasks = state.workflow.tasks.map((task) => task.id === taskId ? { ...task, ...updates, title: updates.title?.trim() || task.title, completedAt: updates.status === "complete" ? now : updates.status ? undefined : task.completedAt } : task);
  return { ...state, workflow: { ...state.workflow, tasks }, activity: [activity(actorId, `Updated workflow task “${current.title}”`, taskId), ...state.activity] };
}

export function setWorkflowPolicy(state: CollaborationReviewState, updates: Partial<Pick<WorkflowSettings, "autoLockOnApproval" | "requirePreflight" | "requireAllTasks">>, actorId = "local-owner"): CollaborationReviewState {
  return { ...state, workflow: { ...state.workflow, ...updates }, activity: [activity(actorId, "Updated professional workflow policy"), ...state.activity] };
}

export function getWorkflowGate(state: CollaborationReviewState, targetStage: WorkflowStageId) {
  const openComments = state.comments.filter((comment) => comment.status !== "resolved");
  const incompleteRequired = state.workflow.tasks.filter((task) => task.required && task.status !== "complete" && WORKFLOW_STAGES.findIndex((stage) => stage.id === task.stageId) <= WORKFLOW_STAGES.findIndex((stage) => stage.id === targetStage));
  const changesRequested = state.approvals.filter((approval) => approval.decision === "changes-requested");
  const preflightComplete = state.workflow.tasks.some((task) => task.stageId === "preflight" && task.status === "complete");
  const reasons: string[] = [];
  if ((targetStage === "approval" || targetStage === "released") && openComments.length) reasons.push(`${openComments.length} review comment(s) remain open`);
  if (state.workflow.requireAllTasks && incompleteRequired.length) reasons.push(`${incompleteRequired.length} required workflow task(s) are incomplete`);
  if (targetStage === "released" && changesRequested.length) reasons.push("A reviewer has requested changes");
  if (targetStage === "released" && state.workflow.requirePreflight && !preflightComplete) reasons.push("Preflight has not been completed");
  if (targetStage === "released" && !buildReviewSummary(state).readyForRelease) reasons.push("Approval policy is not satisfied");
  return { allowed: reasons.length === 0, reasons, openComments: openComments.length, incompleteRequired: incompleteRequired.length };
}

export function advanceWorkflowStage(state: CollaborationReviewState, targetStage: WorkflowStageId, note?: string, actorId = "local-owner"): CollaborationReviewState {
  if (targetStage === state.workflow.currentStage) return state;
  const fromIndex = WORKFLOW_STAGES.findIndex((stage) => stage.id === state.workflow.currentStage);
  const toIndex = WORKFLOW_STAGES.findIndex((stage) => stage.id === targetStage);
  if (fromIndex < 0 || toIndex < 0) return state;
  if (toIndex > fromIndex) {
    const gate = getWorkflowGate(state, targetStage);
    if (!gate.allowed) throw new Error(gate.reasons.join("; "));
  }
  const handoff: WorkflowHandoff = { id: id("handoff"), fromStage: state.workflow.currentStage, toStage: targetStage, actorId, note: note?.trim(), createdAt: Date.now() };
  const lock = state.workflow.autoLockOnApproval && (targetStage === "approval" || targetStage === "released");
  return { ...state, lockedForReview: lock ? true : state.lockedForReview, workflow: { ...state.workflow, currentStage: targetStage, stageStartedAt: Date.now(), handoffs: [handoff, ...state.workflow.handoffs] }, activity: [activity(actorId, `Moved workflow from ${handoff.fromStage} to ${targetStage}`, handoff.id), ...state.activity] };
}

export function buildWorkflowSummary(state: CollaborationReviewState) {
  const tasks = state.workflow.tasks;
  const complete = tasks.filter((task) => task.status === "complete").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const overdue = tasks.filter((task) => task.status !== "complete" && Boolean(task.dueAt && task.dueAt < Date.now())).length;
  const gate = getWorkflowGate(state, "released");
  return { currentStage: state.workflow.currentStage, totalTasks: tasks.length, completeTasks: complete, blockedTasks: blocked, overdueTasks: overdue, progress: tasks.length ? Math.round(complete / tasks.length * 100) : 0, releaseGatePassed: gate.allowed, releaseBlockers: gate.reasons };
}
