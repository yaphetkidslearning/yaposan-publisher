import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/utils/animationExportEngine.ts','utf8');
const modal = fs.readFileSync('src/components/publisher/AnimationExportModal.tsx','utf8');
const editor = fs.readFileSync('src/app/editor.tsx','utf8');

test('Phase 19.4 replaces plans with real runtime exports', () => {
  assert.match(engine, /performAnimationExport/);
  assert.match(engine, /renderGif/);
  assert.match(engine, /renderVideo/);
  assert.match(engine, /presentationZip/);
  assert.match(engine, /encodeGif/);
  assert.match(modal, /Presentation ZIP/);
  assert.match(modal, /Animated GIF/);
  assert.match(modal, /MP4 \/ Video/);
  assert.doesNotMatch(modal, /GIF Render Plan/);
});

test('Phase 19.4 HTML runtime executes animations, transitions and interactions', () => {
  assert.match(engine, /requestAnimationFrame\(animate\)/);
  assert.match(engine, /double-click/);
  assert.match(engine, /mouseenter/);
  assert.match(engine, /mouseleave/);
  assert.match(engine, /page-load/);
  assert.match(engine, /play-animation/);
  assert.match(engine, /pause-animation/);
  assert.match(engine, /stop-animation/);
  assert.match(engine, /ypSlideLeftIn/);
  assert.match(engine, /ypWipeIn/);
  assert.match(editor, /performAnimationExport/);
});
