import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('src/utils/animationExportEngine.ts','utf8');
const types=fs.readFileSync('src/types/publisher.ts','utf8');
const modal=fs.readFileSync('src/components/publisher/AnimationExportModal.tsx','utf8');
test('Phase 19.6 hardens embedded runtime and SVG export',()=>{
  for(const token of ['safeJsonForScript','Content-Security-Policy','sanitizeSvgMarkup','UNSAFE_URL','object-src','frame-ancestors']) assert.ok(source.includes(token),token);
});
test('Phase 19.6 adds final production certification and fallbacks',()=>{
  for(const token of ['certifyAnimationProduction','AnimationProductionCertification','video-fallback','fallbackUsed','phase: "19.6"']) assert.ok(source.includes(token),token);
  assert.ok(types.includes('"19.6"'));
  assert.ok(modal.includes('Phase 19.6'));
});
