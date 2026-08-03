import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const engine = fs.readFileSync("src/utils/interactivePublishingEngine.ts", "utf8");
const modal = fs.readFileSync("src/components/publisher/InteractivePublishingModal.tsx", "utf8");
const editor = fs.readFileSync("src/app/editor.tsx", "utf8");
const toolbar = fs.readFileSync("src/components/publisher/EditorToolbar.tsx", "utf8");
const types = fs.readFileSync("src/types/publisher.ts", "utf8");

test("Phase 19.2 interaction engine covers navigation, visibility, transitions and manifest", () => {
  for (const token of ["go-to-page", "next-page", "previous-page", "open-url", "show-element", "hide-element", "toggle-element", "play-animation", "PageTransition", "executeInteraction", "buildInteractiveManifest"]) assert.match(engine, new RegExp(token));
});

test("Phase 19.2 is integrated into editor, ribbon, modal and persistence types", () => {
  assert.match(modal, /Interactive Publishing & Presentation/);
  assert.match(modal, /Start Presentation/);
  assert.match(editor, /InteractivePublishingModal/);
  assert.match(editor, /setPageTransition/);
  assert.match(toolbar, /Interactions/);
  assert.match(toolbar, /Presentation/);
  assert.match(types, /interactions\?:/);
  assert.match(types, /interactiveSettings\?:/);
  assert.match(types, /"19\.2"/);
});
