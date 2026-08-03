import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ENTERPRISE_WORKSPACE, addComment, auditEnterpriseCollaboration, canPerform, createReviewRequest, decideReview, inviteMember, mergeConcurrentChanges } from "../src/utils/professionalEnterpriseCollaborationEngine";

test("Phase 25.5 enforces enterprise roles", () => {
  assert.equal(canPerform("viewer", "edit"), false);
  assert.equal(canPerform("designer", "manage-assets"), true);
  assert.equal(canPerform("reviewer", "approve"), true);
});
test("Phase 25.5 supports members, comments, and review gates", () => {
  const invited = inviteMember(DEFAULT_ENTERPRISE_WORKSPACE, { name: "Editor", email: "editor@example.com", role: "editor" });
  const commented = addComment(invited, { authorId: "member-owner", body: "Please review the cover.", pageId: "page-1" });
  const requested = createReviewRequest(commented, { title: "Release review", requestedBy: "member-owner", reviewerIds: ["member-reviewer"] });
  const decided = decideReview(requested, requested.reviews[0].id, "member-reviewer", "approved", "Ready");
  assert.equal(invited.members.length, DEFAULT_ENTERPRISE_WORKSPACE.members.length + 1);
  assert.equal(commented.comments[0].status, "open");
  assert.equal(decided.reviews[0].status, "approved");
});
test("Phase 25.5 detects concurrent-field conflicts", () => {
  const result = mergeConcurrentChanges({ title: "A", count: 1 }, { title: "B" }, { title: "C", count: 2 });
  assert.equal(result.requiresResolution, true);
  assert.equal(result.merged.count, 2);
});
test("Phase 25.5 audits sharing governance", () => {
  const unsafe = { ...DEFAULT_ENTERPRISE_WORKSPACE, sharePolicy: { ...DEFAULT_ENTERPRISE_WORKSPACE.sharePolicy, linkAccess: "organization" as const, requireSignIn: false, allowCopy: true } };
  const report = auditEnterpriseCollaboration(unsafe);
  assert.ok(report.score < 100);
  assert.ok(report.issues.some((issue) => issue.id === "anonymous"));
});
