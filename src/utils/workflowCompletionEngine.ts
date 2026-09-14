import type { PublisherProject } from "../types/publisher";
import {
  WORKFLOW_STAGES,
  buildReviewSummary,
  buildWorkflowSummary,
  getWorkflowGate,
  type CollaborationReviewState,
  type WorkflowStageId,
  type WorkflowTask,
} from "./collaborationReviewEngine";

export type Phase203AutomationSettings = {
  enabled: boolean;
  createStageChecklists: boolean;
  notifyOverdueWork: boolean;
  lockCertifiedRelease: boolean;
};

export type Phase203Notification = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  targetId?: string;
};

export type Phase203ReleaseRecord = {
  id: string;
  label: string;
  certificateNumber: string;
  createdAt: number;
  actorId: string;
  projectUpdatedAt: number;
  pageCount: number;
  elementCount: number;
  commentCount: number;
  taskCount: number;
  approvalCount: number;
  checksum: string;
  archivedAt?: number;
};

export type Phase203CompletionState = {
  version: "20.3";
  automation: Phase203AutomationSettings;
  releases: Phase203ReleaseRecord[];
  lastAutomationAt?: number;
};

type State203 = CollaborationReviewState & { completion?: Partial<Phase203CompletionState> };

const DEFAULT_AUTOMATION: Phase203AutomationSettings = {
  enabled: true,
  createStageChecklists: true,
  notifyOverdueWork: true,
  lockCertifiedRelease: true,
};

const stageChecklist: Record<WorkflowStageId, string[]> = {
  draft: ["Confirm publication scope", "Complete initial content"],
  "content-review": ["Verify copy and data", "Resolve content comments"],
  "design-review": ["Check layout and brand consistency", "Review accessibility"],
  preflight: ["Run production preflight", "Verify links and assets"],
  approval: ["Collect required approvals", "Confirm release notes"],
  released: ["Archive release package"],
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export function getPhase203CompletionState(state: CollaborationReviewState): Phase203CompletionState {
  const stored = (state as State203).completion;
  return {
    version: "20.3",
    automation: { ...DEFAULT_AUTOMATION, ...(stored?.automation ?? {}) },
    releases: stored?.releases ?? [],
    lastAutomationAt: stored?.lastAutomationAt,
  };
}

function withCompletion(state: CollaborationReviewState, completion: Phase203CompletionState): CollaborationReviewState {
  return { ...state, completion } as CollaborationReviewState;
}

export function setPhase203Automation(
  state: CollaborationReviewState,
  updates: Partial<Phase203AutomationSettings>,
): CollaborationReviewState {
  const completion = getPhase203CompletionState(state);
  return withCompletion(state, { ...completion, automation: { ...completion.automation, ...updates } });
}

export function buildPhase203Notifications(state: CollaborationReviewState, now = Date.now()): Phase203Notification[] {
  const completion = getPhase203CompletionState(state);
  const notifications: Phase203Notification[] = [];
  const openUrgent = state.comments.filter((comment) => comment.status !== "resolved" && comment.priority === "urgent");
  const overdueComments = state.comments.filter((comment) => comment.status !== "resolved" && Boolean(comment.dueAt && comment.dueAt < now));
  const blockedTasks = state.workflow.tasks.filter((task) => task.status === "blocked");
  const overdueTasks = state.workflow.tasks.filter((task) => task.status !== "complete" && Boolean(task.dueAt && task.dueAt < now));
  const changes = state.approvals.filter((approval) => approval.decision === "changes-requested");
  if (openUrgent.length) notifications.push({ id: "urgent-comments", severity: "critical", title: `${openUrgent.length} urgent review item(s)`, detail: "Urgent comments must be resolved before approval." });
  if (completion.automation.notifyOverdueWork && overdueComments.length) notifications.push({ id: "overdue-comments", severity: "warning", title: `${overdueComments.length} overdue comment(s)`, detail: "Review assignments have passed their due dates." });
  if (blockedTasks.length) notifications.push({ id: "blocked-tasks", severity: "critical", title: `${blockedTasks.length} blocked workflow task(s)`, detail: "Remove blockers before advancing the publication." });
  if (completion.automation.notifyOverdueWork && overdueTasks.length) notifications.push({ id: "overdue-tasks", severity: "warning", title: `${overdueTasks.length} overdue workflow task(s)`, detail: "Workflow tasks require attention." });
  if (changes.length) notifications.push({ id: "changes-requested", severity: "critical", title: "Changes requested", detail: "At least one reviewer rejected the current release candidate." });
  if (!notifications.length) notifications.push({ id: "workflow-current", severity: "info", title: "Workflow is current", detail: "No urgent, blocked, or overdue review work was detected." });
  return notifications;
}

export function runPhase203Automation(state: CollaborationReviewState, actorId = "local-owner"): CollaborationReviewState {
  const completion = getPhase203CompletionState(state);
  if (!completion.automation.enabled) return state;
  let tasks = state.workflow.tasks;
  if (completion.automation.createStageChecklists) {
    const stage = state.workflow.currentStage;
    const existing = new Set(tasks.filter((task) => task.stageId === stage).map((task) => task.title.toLowerCase()));
    const created: WorkflowTask[] = stageChecklist[stage]
      .filter((title) => !existing.has(title.toLowerCase()))
      .map((title) => ({ id: uid("task"), title, stageId: stage, status: "pending", required: true, createdAt: Date.now() }));
    tasks = [...created, ...tasks];
  }
  const nextCompletion = { ...completion, lastAutomationAt: Date.now() };
  return {
    ...state,
    workflow: { ...state.workflow, tasks },
    activity: [{ id: uid("activity"), actorId, action: `Ran workflow automation for ${state.workflow.currentStage}`, createdAt: Date.now() }, ...state.activity],
    completion: nextCompletion,
  } as CollaborationReviewState;
}

export function buildPhase203Dashboard(project: PublisherProject, state: CollaborationReviewState) {
  const review = buildReviewSummary(state);
  const workflow = buildWorkflowSummary(state);
  const completion = getPhase203CompletionState(state);
  const notifications = buildPhase203Notifications(state);
  const activeStageIndex = WORKFLOW_STAGES.findIndex((stage) => stage.id === state.workflow.currentStage);
  const stageProgress = activeStageIndex < 0 ? 0 : Math.round((activeStageIndex / (WORKFLOW_STAGES.length - 1)) * 100);
  const score = Math.max(0, Math.min(100,
    100
      - review.openComments * 8
      - review.urgentComments * 12
      - workflow.blockedTasks * 15
      - workflow.overdueTasks * 5
      - (review.changesRequested ? 20 : 0),
  ));
  return {
    score,
    stageProgress,
    review,
    workflow,
    notifications,
    releaseCount: completion.releases.length,
    latestRelease: completion.releases[0],
    projectPages: project.pages.length,
    projectElements: project.pages.reduce((sum, page) => sum + page.elements.length, 0),
  };
}

export function certifyPhase203Release(
  project: PublisherProject,
  state: CollaborationReviewState,
  label: string,
  actorId = "local-owner",
): CollaborationReviewState {
  const gate = getWorkflowGate(state, "released");
  if (!gate.allowed) throw new Error(gate.reasons.join("; "));
  const completion = getPhase203CompletionState(state);
  const createdAt = Date.now();
  const payload = JSON.stringify({ projectId: project.id, updatedAt: project.updatedAt, pages: project.pages.length, comments: state.comments.length, tasks: state.workflow.tasks.length, approvals: state.approvals.length, createdAt });
  const record: Phase203ReleaseRecord = {
    id: uid("release"),
    label: label.trim() || `Certified Release ${completion.releases.length + 1}`,
    certificateNumber: `YP-20.3-${new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, "")}-${hash(payload)}`,
    createdAt,
    actorId,
    projectUpdatedAt: project.updatedAt,
    pageCount: project.pages.length,
    elementCount: project.pages.reduce((sum, page) => sum + page.elements.length, 0),
    commentCount: state.comments.length,
    taskCount: state.workflow.tasks.length,
    approvalCount: state.approvals.filter((approval) => approval.decision === "approved").length,
    checksum: hash(payload),
  };
  return {
    ...state,
    lockedForReview: completion.automation.lockCertifiedRelease ? true : state.lockedForReview,
    workflow: { ...state.workflow, currentStage: "released", stageStartedAt: createdAt },
    activity: [{ id: uid("activity"), actorId, action: `Certified final release “${record.label}”`, targetId: record.id, createdAt }, ...state.activity],
    completion: { ...completion, releases: [record, ...completion.releases] },
  } as CollaborationReviewState;
}

export function archivePhase203Release(state: CollaborationReviewState, releaseId: string, actorId = "local-owner"): CollaborationReviewState {
  const completion = getPhase203CompletionState(state);
  const releases = completion.releases.map((release) => release.id === releaseId ? { ...release, archivedAt: release.archivedAt ?? Date.now() } : release);
  return {
    ...state,
    activity: [{ id: uid("activity"), actorId, action: "Archived a certified release", targetId: releaseId, createdAt: Date.now() }, ...state.activity],
    completion: { ...completion, releases },
  } as CollaborationReviewState;
}

export function exportPhase203CompletionReport(project: PublisherProject, state: CollaborationReviewState): string {
  return JSON.stringify({
    schema: "yaposan.phase20.final-completion",
    version: 1,
    phase: "20.3",
    generatedAt: Date.now(),
    project: { id: project.id, name: project.name, updatedAt: project.updatedAt },
    dashboard: buildPhase203Dashboard(project, state),
    completion: getPhase203CompletionState(state),
    workflow: state.workflow,
    reviewSummary: buildReviewSummary(state),
  }, null, 2);
}
