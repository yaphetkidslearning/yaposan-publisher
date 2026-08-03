import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("Phase 19.1 provides keyframes, motion paths and professional animation workflow", () => {
  const source = read("src/utils/animationEngine.ts");
  for (const token of [
    "AnimationKeyframe", "MotionPath", "createAnimationKeyframe", "addKeyframeToAnimation",
    "createMotionPath", "setAnimationMotionPath", "duplicateElementAnimation",
    "reverseElementAnimation", "copyElementAnimations", "pasteElementAnimations",
    "staggerAnimations", "interpolateKeyframes", "pointOnMotionPath", "customBezier",
  ]) assert.ok(source.includes(token), token);
});

test("Phase 19.1 is integrated into the real editor, ribbon and advanced motion studio", () => {
  const editor = read("src/app/editor.tsx");
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  const modal = read("src/components/publisher/AnimationStudioModal.tsx");
  const types = read("src/types/publisher.ts");
  for (const token of ["animationClipboard", "duplicateElementAnimation", "reverseElementAnimation", "pasteElementAnimations", "staggerAnimations"]) assert.ok(editor.includes(token), token);
  for (const token of ["Phase 19.1 Advanced Motion", "Keyframes & Paths"]) assert.ok(toolbar.includes(token), token);
  for (const token of ["Advanced Motion Studio", "Property Keyframes", "Motion Path", "Custom Cubic Bézier", "Copy Animation", "Stagger 0.15s"]) assert.ok(modal.includes(token), token);
  assert.ok(types.includes('phase19Version?: "19.0" | "19.1"'));
});
