import assert from "node:assert/strict";
import test from "node:test";
import { auditEnterpriseSecurity, DEFAULT_ENTERPRISE_SECURITY_WORKSPACE, resolveSecurityEvent, setMemberSuspended } from "../src/utils/professionalEnterpriseSecurityEngine";

test("Phase 25.9 audits enterprise security controls", () => {
  const report = auditEnterpriseSecurity(DEFAULT_ENTERPRISE_SECURITY_WORKSPACE);
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.equal(report.protectedMembers, 2);
  assert.ok(report.complianceCoverage > 0);
  assert.ok(report.issues.some((issue) => issue.message.includes("MFA")));
});

test("Phase 25.9 resolves security events", () => {
  const workspace = resolveSecurityEvent(DEFAULT_ENTERPRISE_SECURITY_WORKSPACE, "e-1");
  assert.equal(workspace.events.find((event) => event.id === "e-1")?.resolved, true);
});

test("Phase 25.9 suspends and restores members", () => {
  const suspended = setMemberSuspended(DEFAULT_ENTERPRISE_SECURITY_WORKSPACE, "m-editor", true);
  assert.equal(suspended.members.find((member) => member.id === "m-editor")?.suspended, true);
  const restored = setMemberSuspended(suspended, "m-editor", false);
  assert.equal(restored.members.find((member) => member.id === "m-editor")?.suspended, false);
});
