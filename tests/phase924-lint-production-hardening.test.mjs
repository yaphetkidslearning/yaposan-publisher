import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

test("Phase 92.4 release files exist", () => {
  for (const file of [
    "PHASE92.4-LINT-AND-PRODUCTION-HARDENING.md",
    "PHASE92.3.1-QA-AND-GUIDES-QUICK-ACCESS.md",
    "src/components/publisher/PublisherCanvas.tsx",
    "src/components/text/EditableText.tsx",
    "src/hooks/useTextEditor.ts",
    "src/templates/templateEngine.ts",
    "src/utils/exportEngine.js",
  ]) {
    assert.equal(existsSync(file), true, `Missing ${file}`);
  }
});

test("Phase 92.4 verification chain is present", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(typeof pkg.scripts?.["test:phase92.4"], "string");
  assert.equal(typeof pkg.scripts?.["verify:phase92.4"], "string");
  const verify = pkg.scripts["verify:phase92.4"];
  for (const required of [
    "npm run typecheck",
    "npm run lint",
    "npm run test:phase92.3",
    "npm run test:phase92.3.1",
    "npm run test:phase92.4",
    "npm run build:web",
  ]) {
    assert.match(verify, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("known Phase 92.3.1 lint blockers remain repaired", () => {
  const templateEngine = readFileSync("src/templates/templateEngine.ts", "utf8");
  const exportEngine = readFileSync("src/utils/exportEngine.js", "utf8");
  const textEditor = readFileSync("src/hooks/useTextEditor.ts", "utf8");
  assert.doesNotMatch(exportEngine, /\bBuffer\b/);
  assert.match(textEditor, /canUndo:\s*historyAvailability\.canUndo/);
  assert.match(textEditor, /canRedo:\s*historyAvailability\.canRedo/);
  const exports = templateEngine.split(/\r?\n/).filter((line) => line.startsWith("export "));
  assert.ok(exports.length > 0);
});
