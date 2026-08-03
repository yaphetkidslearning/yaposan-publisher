import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync("src/app/editor.tsx", "utf8");
const toolbar = readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const versions = readFileSync("src/app/versions.tsx", "utf8");
const projects = readFileSync("src/app/projects.tsx", "utf8");
const photoStudio = readFileSync("src/app/photo-studio.tsx", "utf8");
const imageEditor = readFileSync("src/app/image-editor.tsx", "utf8");

 test("recovery uses a branded in-app decision dialog instead of browser confirm", () => {
  assert.doesNotMatch(editor, /window\.confirm\(\s*`A newer recovered copy/);
  assert.match(editor, /Recovered work found/);
  assert.match(editor, /Discard recovered work/);
  assert.match(editor, /Restore recovered work/);
  assert.match(editor, /requestRecoveryDecision/);
});

test("recovery dialog is accessible and does not dismiss accidentally", () => {
  assert.match(editor, /accessibilityRole="alert"/);
  assert.match(editor, /onRequestClose=\{\(\) => finishRecoveryDecision\(false\)\}/);
  assert.match(editor, /recoveryDecisionRef/);
});

test("font chooser is responsive, scrollable, and accessible", () => {
  assert.match(toolbar, /maxWidth: 360/);
  assert.match(toolbar, /paddingHorizontal: 16/);
  assert.match(toolbar, /event\.stopPropagation\(\)/);
  assert.match(toolbar, /Close font list/);
  assert.match(toolbar, /Use \$\{family\} font/);
});

test("core project screens no longer expose internal implementation phase labels", () => {
  assert.doesNotMatch(versions, /PHASE 8B/);
  assert.doesNotMatch(projects, /PHASE 8D/);
  assert.doesNotMatch(photoStudio, /Phase 17\.18/);
  assert.doesNotMatch(imageEditor, /Phase 17\.18/);
});

test("editor notices use product language instead of internal phase numbers", () => {
  assert.doesNotMatch(editor, /Phase 22\.6 runtime report exported/);
  assert.doesNotMatch(editor, /Phase 22\.7 full-fidelity website ZIP exported/);
  assert.doesNotMatch(editor, /Immutable Phase 23 version created/);
  assert.match(editor, /Full-fidelity website ZIP exported/);
  assert.match(editor, /Immutable project version created/);
});
