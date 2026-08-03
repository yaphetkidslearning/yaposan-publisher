import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_AUTOMATION_WORKSPACE, addAutomationAction, addAutomationRule, auditAutomationWorkspace, createAutomationRule, executeAutomationRule, runTrigger, updateAutomationRule } from "../src/utils/professionalWorkflowAutomationEngine";

test("creates, configures, and executes workflow automation", () => {
  const draft = createAutomationRule({ name: "Web release", trigger: "manual" });
  let workspace = addAutomationRule(DEFAULT_AUTOMATION_WORKSPACE, draft);
  workspace = addAutomationAction(workspace, draft.id, { type: "preflight", label: "Run web preflight", configuration: { profile: "web" }, continueOnError: false });
  workspace = updateAutomationRule(workspace, draft.id, { status: "active" });
  workspace = executeAutomationRule(workspace, draft.id, { projectName: "Yaposan" });
  const rule = workspace.rules.find((item) => item.id === draft.id);
  assert.equal(rule?.runCount, 1);
  assert.equal(workspace.runs[0]?.status, "completed");
  assert.equal(workspace.runs[0]?.steps.length, 1);
});

test("runs all active rules for a matching trigger", () => {
  const next = runTrigger(DEFAULT_AUTOMATION_WORKSPACE, "project-saved", { projectName: "Yaposan" });
  assert.equal(next.runs.length, 1);
  assert.equal(next.rules.find((rule) => rule.id === "rule-safe-backup")?.runCount, 1);
});

test("audits unsafe and incomplete workflows", () => {
  const empty = createAutomationRule({ name: "Incomplete", trigger: "schedule" });
  const workspace = addAutomationRule(DEFAULT_AUTOMATION_WORKSPACE, empty);
  const audit = auditAutomationWorkspace(workspace);
  assert.ok(audit.score < 100);
  assert.ok(audit.issues.some((issue) => issue.id.startsWith("empty-")));
  assert.ok(audit.issues.some((issue) => issue.id.startsWith("schedule-")));
});
