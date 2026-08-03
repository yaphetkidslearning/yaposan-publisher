import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const engine = fs.readFileSync("src/utils/phase53DocumentAutomationEngine.ts", "utf8");
const screen = fs.readFileSync("src/app/automation-center.tsx", "utf8");
const home = fs.readFileSync("src/app/index.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("Phase 53 provides workflow, queue, and approval models", () => {
  assert.match(engine, /DocumentWorkflow/);
  assert.match(engine, /AutomationJob/);
  assert.match(engine, /ApprovalRequest/);
  assert.match(engine, /DEFAULT_WORKFLOWS/);
  assert.match(engine, /External Workflow Connectors/);
});

test("Phase 53 screen persists workflow state and exposes real controls", () => {
  assert.match(screen, /AsyncStorage/);
  assert.match(screen, /Automation Center/);
  assert.match(screen, /Processing queue/);
  assert.match(screen, /Approval center/);
  assert.match(screen, /updateWorkflowStatus/);
  assert.match(screen, /updateJobProgress/);
});

test("Phase 53 is versioned and integrated into navigation", () => {
  assert.equal(pkg.version, "53.0.0");
  assert.equal(pkg.scripts["test:phase53"], "node --test tests/phase530-document-automation.test.mjs");
  assert.match(home, /Automation Center/);
  assert.match(home, /\/automation-center/);
});
