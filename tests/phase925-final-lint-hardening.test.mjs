import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8");

test("Phase 92.5 release files and verification chain exist", () => {
  assert.equal(existsSync("PHASE92.5-FINAL-LINT-HARDENING.md"), true);
  const pkg = JSON.parse(read("package.json"));
  assert.equal(typeof pkg.scripts?.["test:phase92.5"], "string");
  assert.equal(typeof pkg.scripts?.["verify:phase92.5"], "string");
  for (const command of [
    "npm run typecheck",
    "npm run lint",
    "npm run test:phase92.3",
    "npm run test:phase92.3.1",
    "npm run test:phase92.4",
    "npm run test:phase92.5",
    "npm run build:web",
  ]) assert.ok(pkg.scripts["verify:phase92.5"].includes(command));
});

test("Phase 92.5 known remaining lint blockers are removed", () => {
  const templates = read("src/app/templates-classic.tsx");
  assert.equal((templates.match(/modalCard:/g) ?? []).length, 1);
  assert.doesNotMatch(templates, /useEffect\(\(\) => setVisibleCount/);

  const canvas = read("src/components/publisher/PublisherCanvas.tsx");
  assert.doesNotMatch(canvas, /^\s*startRotation\s*=\s*element\.rotation;/m);
  assert.doesNotMatch(canvas, /penNodes\s*=\s*\[\.\.\.penNodes,node\]/);
  assert.doesNotMatch(canvas, /penNodes\s*=\s*\[\]/);

  const ai = read("src/components/publisher/AiCompletionPanel.tsx");
  assert.doesNotMatch(ai, /updatedAt:Date\.now\(\)/);
});

test("Phase 92.5 effect refreshes are deferred from effect bodies", () => {
  for (const file of [
    "src/app/support-requests.tsx",
    "src/app/support-inbox.tsx",
    "src/app/team-hub.tsx",
    "src/app/enterprise-operations-center.tsx",
    "src/app/troubleshoot.tsx",
    "src/components/ai/AIAccessManager.tsx",
    "src/components/billing/BillingManager.tsx",
  ]) {
    assert.match(read(file), /queueMicrotask/);
  }
});
