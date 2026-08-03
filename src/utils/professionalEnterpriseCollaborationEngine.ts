export type EnterpriseRole = "owner" | "admin" | "designer" | "editor" | "reviewer" | "viewer";
export type PresenceState = "online" | "away" | "offline";
export type ReviewStatus = "open" | "in-review" | "approved" | "changes-requested" | "resolved";
export type PermissionAction = "view" | "comment" | "edit" | "manage-assets" | "invite" | "approve" | "publish" | "administer";

export type WorkspaceMember = {
  id: string; name: string; email: string; role: EnterpriseRole; presence: PresenceState;
  currentPageId?: string; color: string; lastSeenAt: number;
};
export type CollaborationComment = {
  id: string; authorId: string; body: string; createdAt: number; pageId?: string; elementId?: string;
  mentions: string[]; status: "open" | "resolved"; replies: { id: string; authorId: string; body: string; createdAt: number }[];
};
export type ReviewRequest = {
  id: string; title: string; requestedBy: string; reviewerIds: string[]; status: ReviewStatus;
  dueAt?: number; createdAt: number; decisionNote?: string;
};
export type ActivityEntry = { id: string; actorId: string; action: string; target: string; createdAt: number; details?: string };
export type SharePolicy = {
  linkAccess: "disabled" | "organization" | "invited-only"; allowDownload: boolean; allowCopy: boolean;
  expiresAt?: number; requireSignIn: boolean; watermarkExports: boolean;
};
export type CollaborationWorkspace = {
  id: string; name: string; organization: string; members: WorkspaceMember[]; comments: CollaborationComment[];
  reviews: ReviewRequest[]; activity: ActivityEntry[]; sharePolicy: SharePolicy; version: number;
};
export type CollaborationAudit = { score: number; issues: { id: string; severity: "error" | "warning" | "info"; message: string; fix: string }[] };

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const roleRank: Record<EnterpriseRole, number> = { viewer: 0, reviewer: 1, editor: 2, designer: 3, admin: 4, owner: 5 };
const actionMinimumRole: Record<PermissionAction, EnterpriseRole> = {
  view: "viewer", comment: "reviewer", edit: "editor", "manage-assets": "designer", invite: "admin",
  approve: "reviewer", publish: "admin", administer: "owner",
};

export const DEFAULT_ENTERPRISE_WORKSPACE: CollaborationWorkspace = {
  id: "workspace-yaposan", name: "Yaposan Publishing Workspace", organization: "Yaposan",
  version: 1,
  members: [
    { id: "member-owner", name: "Workspace Owner", email: "owner@yaposan.local", role: "owner", presence: "online", color: "#0F766E", currentPageId: "page-1", lastSeenAt: Date.now() },
    { id: "member-designer", name: "Lead Designer", email: "designer@yaposan.local", role: "designer", presence: "online", color: "#7C3AED", currentPageId: "page-2", lastSeenAt: Date.now() },
    { id: "member-reviewer", name: "Brand Reviewer", email: "reviewer@yaposan.local", role: "reviewer", presence: "away", color: "#D97706", lastSeenAt: Date.now() - 900000 },
  ],
  comments: [{ id: "comment-1", authorId: "member-reviewer", body: "Confirm the final brand headline before release.", createdAt: Date.now() - 3600000, pageId: "page-1", mentions: ["member-owner"], status: "open", replies: [] }],
  reviews: [{ id: "review-1", title: "Brand and production approval", requestedBy: "member-owner", reviewerIds: ["member-reviewer"], status: "in-review", createdAt: Date.now() - 7200000 }],
  activity: [{ id: "activity-1", actorId: "member-designer", action: "updated", target: "Cover layout", createdAt: Date.now() - 1200000, details: "Adjusted image crop and headline hierarchy" }],
  sharePolicy: { linkAccess: "invited-only", allowDownload: true, allowCopy: false, requireSignIn: true, watermarkExports: false },
};

export function canPerform(role: EnterpriseRole, action: PermissionAction): boolean {
  if (action === "approve" && role === "reviewer") return true;
  return roleRank[role] >= roleRank[actionMinimumRole[action]];
}

export function inviteMember(workspace: CollaborationWorkspace, input: { name: string; email: string; role: EnterpriseRole }): CollaborationWorkspace {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("A valid email address is required.");
  if (workspace.members.some((member) => member.email.toLowerCase() === email)) throw new Error("This person is already a workspace member.");
  const member: WorkspaceMember = { id: uid("member"), name: input.name.trim() || email.split("@")[0], email, role: input.role, presence: "offline", color: "#2563EB", lastSeenAt: Date.now() };
  return appendActivity({ ...workspace, members: [...workspace.members, member], version: workspace.version + 1 }, "member-owner", "invited", member.name, `${member.role} access`);
}

export function addComment(workspace: CollaborationWorkspace, input: { authorId: string; body: string; pageId?: string; elementId?: string; mentions?: string[] }): CollaborationWorkspace {
  const body = input.body.trim();
  if (!body) throw new Error("Comment text is required.");
  const comment: CollaborationComment = { id: uid("comment"), authorId: input.authorId, body, createdAt: Date.now(), pageId: input.pageId, elementId: input.elementId, mentions: input.mentions ?? [], status: "open", replies: [] };
  return appendActivity({ ...workspace, comments: [comment, ...workspace.comments], version: workspace.version + 1 }, input.authorId, "commented on", input.elementId || input.pageId || "document");
}

export function resolveComment(workspace: CollaborationWorkspace, commentId: string, actorId: string): CollaborationWorkspace {
  const comments = workspace.comments.map((comment) => comment.id === commentId ? { ...comment, status: "resolved" as const } : comment);
  return appendActivity({ ...workspace, comments, version: workspace.version + 1 }, actorId, "resolved comment", commentId);
}

export function createReviewRequest(workspace: CollaborationWorkspace, input: { title: string; requestedBy: string; reviewerIds: string[]; dueAt?: number }): CollaborationWorkspace {
  if (!input.reviewerIds.length) throw new Error("At least one reviewer is required.");
  const review: ReviewRequest = { id: uid("review"), title: input.title.trim() || "Document review", requestedBy: input.requestedBy, reviewerIds: input.reviewerIds, status: "open", dueAt: input.dueAt, createdAt: Date.now() };
  return appendActivity({ ...workspace, reviews: [review, ...workspace.reviews], version: workspace.version + 1 }, input.requestedBy, "requested review", review.title);
}

export function decideReview(workspace: CollaborationWorkspace, reviewId: string, reviewerId: string, decision: "approved" | "changes-requested", note = ""): CollaborationWorkspace {
  const member = workspace.members.find((candidate) => candidate.id === reviewerId);
  if (!member || !canPerform(member.role, "approve")) throw new Error("This member cannot approve reviews.");
  const reviews = workspace.reviews.map((review) => review.id === reviewId ? { ...review, status: decision as ReviewStatus, decisionNote: note.trim() } : review);
  return appendActivity({ ...workspace, reviews, version: workspace.version + 1 }, reviewerId, decision === "approved" ? "approved" : "requested changes for", reviewId, note);
}

export function updatePresence(workspace: CollaborationWorkspace, memberId: string, presence: PresenceState, currentPageId?: string): CollaborationWorkspace {
  return { ...workspace, members: workspace.members.map((member) => member.id === memberId ? { ...member, presence, currentPageId, lastSeenAt: Date.now() } : member), version: workspace.version + 1 };
}

export function mergeConcurrentChanges<T extends Record<string, unknown>>(base: T, local: Partial<T>, remote: Partial<T>) {
  const merged = { ...base } as T;
  const conflicts: { field: keyof T; local: unknown; remote: unknown }[] = [];
  const fields = new Set([...Object.keys(local), ...Object.keys(remote)] as (keyof T)[]);
  fields.forEach((field) => {
    const localChanged = field in local && local[field] !== base[field];
    const remoteChanged = field in remote && remote[field] !== base[field];
    if (localChanged && remoteChanged && local[field] !== remote[field]) conflicts.push({ field, local: local[field], remote: remote[field] });
    else if (remoteChanged) merged[field] = remote[field] as T[keyof T];
    else if (localChanged) merged[field] = local[field] as T[keyof T];
  });
  return { merged, conflicts, requiresResolution: conflicts.length > 0 };
}

export function auditEnterpriseCollaboration(workspace: CollaborationWorkspace): CollaborationAudit {
  const issues: CollaborationAudit["issues"] = [];
  if (!workspace.members.some((member) => member.role === "owner")) issues.push({ id: "owner", severity: "error", message: "Workspace has no owner.", fix: "Assign at least one active owner." });
  if (workspace.sharePolicy.linkAccess !== "disabled" && !workspace.sharePolicy.requireSignIn) issues.push({ id: "anonymous", severity: "warning", message: "Shared links do not require sign-in.", fix: "Require authentication for enterprise documents." });
  if (workspace.sharePolicy.allowCopy) issues.push({ id: "copy", severity: "warning", message: "Shared content can be copied.", fix: "Disable copying for confidential publications." });
  const overdue = workspace.reviews.filter((review) => review.dueAt && review.dueAt < Date.now() && !["approved", "resolved"].includes(review.status));
  if (overdue.length) issues.push({ id: "overdue", severity: "warning", message: `${overdue.length} review request(s) are overdue.`, fix: "Reassign, extend, or close overdue reviews." });
  const openComments = workspace.comments.filter((comment) => comment.status === "open").length;
  if (openComments > 10) issues.push({ id: "comments", severity: "info", message: `${openComments} comments remain open.`, fix: "Resolve completed discussion threads before release." });
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === "error" ? 25 : issue.severity === "warning" ? 10 : 3), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}

function appendActivity(workspace: CollaborationWorkspace, actorId: string, action: string, target: string, details?: string): CollaborationWorkspace {
  const activity: ActivityEntry = { id: uid("activity"), actorId, action, target, details, createdAt: Date.now() };
  return { ...workspace, activity: [activity, ...workspace.activity].slice(0, 250) };
}
