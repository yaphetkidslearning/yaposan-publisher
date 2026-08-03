import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const editor = readFileSync("src/app/editor.tsx", "utf8");
const versionModal = readFileSync("src/components/publisher/CollaborationVersionControlModal.tsx", "utf8");
const documentModal = readFileSync("src/components/publisher/DocumentFoundationModal.tsx", "utf8");
const digitalModal = readFileSync("src/components/publisher/DigitalPublishingStudioModal.tsx", "utf8");
const animationModal = readFileSync("src/components/publisher/AnimationStudioModal.tsx", "utf8");

test("Phase 23.5 exposes one complete production verification command", () => {
  assert.equal(pkg.version, "23.5.0");
  const command = pkg.scripts["verify:phase23.5"];
  assert.match(command, /verify:phase22/);
  for (const phase of ["23.0", "23.1", "23.2", "23.3", "23.4", "23.5"]) assert.match(command, new RegExp(`test:phase${phase.replace('.', '\\.')}`));
  assert.match(command, /audit:phase23\.5/);
  assert.match(command, /expo export --platform web/);
});

test("normal editor notices no longer expose implementation phase numbers", () => {
  assert.doesNotMatch(editor, /showEditorNotice\("Phase (20|21|22|23)/);
  assert.match(editor, /Version certification report exported/);
  assert.match(editor, /Publication preflight completed/);
});

test("collaboration workspace uses product-facing terminology", () => {
  assert.doesNotMatch(versionModal, />Phase 23\.2 Collaboration/);
  assert.match(versionModal, /Collaboration, Governance & Release Control/);
});

test("document, digital, and animation dialogs hide internal phase labels", () => {
  assert.doesNotMatch(documentModal, />Phase 21\.0/);
  assert.doesNotMatch(digitalModal, /Phase 22\.7/);
  assert.doesNotMatch(animationModal, /Phase 19\.1/);
});

test("final production audit is wired into package scripts", () => {
  assert.equal(pkg.scripts["audit:phase23.5"], "node scripts/phase235-production-audit.mjs");
  assert.equal(pkg.scripts["test:phase23.5"], "node --experimental-strip-types --test tests/phase235-final-completion.test.ts");
});
