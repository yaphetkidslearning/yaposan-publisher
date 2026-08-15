import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const toolbar = fs.readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const editor = fs.readFileSync("src/app/editor.tsx", "utf8");

test("Publisher exposes QA / Quality as an always-visible quick action", () => {
  assert.match(toolbar, /label="QA \/ Quality"/);
  assert.match(toolbar, /label="QA \/ Quality" onPress=\{onOpenPrepress\}/);
});

test("Publisher exposes Guides as a direct quick toggle", () => {
  assert.match(toolbar, /showGuides: boolean/);
  assert.match(toolbar, /onToggleGuides: \(\) => void/);
  assert.match(toolbar, /label="Guides" onPress=\{onToggleGuides\} active=\{showGuides\}/);
});

test("Editor wires quick Guides control to the existing guide state", () => {
  assert.match(editor, /showGuides=\{showGuides\}/);
  assert.match(editor, /onToggleGuides=\{\(\) => setShowGuides\(\(value\) => !value\)\}/);
  assert.match(editor, /<PublisherCanvas[\s\S]*showGuides=\{showGuides\}/);
});
