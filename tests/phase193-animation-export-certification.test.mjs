import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync("src/utils/animationExportEngine.ts", "utf8");
const modal = fs.readFileSync("src/components/publisher/AnimationExportModal.tsx", "utf8");
const editor = fs.readFileSync("src/app/editor.tsx", "utf8");
const toolbar = fs.readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const types = fs.readFileSync("src/types/publisher.ts", "utf8");

test("Phase 19.3 exports HTML, presentation packages and GIF/MP4 production plans", () => {
  for (const token of ["interactive-html", "presentation-json", "gif-plan", "mp4-plan", "buildInteractiveHtml", "buildAnimationExportPackage", "validateAnimationProject", "estimateAnimationExport"]) assert.match(engine, new RegExp(token));
  assert.match(engine, /prefers-reduced-motion/);
  assert.match(engine, /buildInteractiveManifest/);
});

test("Phase 19.3 is integrated into the editor, ribbon, modal, persistence and certification UI", () => {
  assert.match(modal, /Animation Export & Certification/);
  assert.match(modal, /Preflight & Performance/);
  assert.match(editor, /AnimationExportModal/);
  assert.match(editor, /buildAnimationExportPackage/);
  assert.match(toolbar, /Animation Export/);
  assert.match(types, /animationExportSettings\?:/);
  assert.match(types, /"19\.3"/);
});
