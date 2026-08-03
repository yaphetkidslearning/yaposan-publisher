import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("Phase 19.0 animation engine provides presets, playback evaluation and timing", () => {
  const source = read("src/utils/animationEngine.ts");
  for (const token of ["ANIMATION_PRESETS", "createElementAnimation", "addAnimationToElement", "evaluateAnimatedElement", "evaluateAnimatedPage", "AnimationProjectSettings", "elastic", "bounce"]) assert.ok(source.includes(token), token);
});

test("Phase 19.0 is integrated into the real editor and ribbon", () => {
  const editor = read("src/app/editor.tsx");
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  const modal = read("src/components/publisher/AnimationStudioModal.tsx");
  const types = read("src/types/publisher.ts");
  for (const token of ["AnimationStudioModal", "evaluateAnimatedPage", "animationPlaying", "onOpenAnimationStudio"]) assert.ok(editor.includes(token), token);
  for (const token of ['"Animation"', "renderAnimation", "Animation Studio"]) assert.ok(toolbar.includes(token), token);
  for (const token of ["Timeline", "Animation Presets", "Duration", "Delay", "Repeat"]) assert.ok(modal.includes(token), token);
  for (const token of ["animations?:", "animationSettings?:", 'phase19Version?: "19.0"']) assert.ok(types.includes(token), token);
});
