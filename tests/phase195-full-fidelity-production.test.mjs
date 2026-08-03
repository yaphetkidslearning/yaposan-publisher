import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('src/utils/animationExportEngine.ts','utf8');
const types=fs.readFileSync('src/types/publisher.ts','utf8');
test('Phase 19.5 exports full-fidelity publication objects and assets',()=>{
  for(const token of ['elementInnerMarkup','svgElementMarkup','rasterRenderedImageUri','svgMarkup','tableMarkup','vectorPath','collectAssetUris','assets/asset-','embeddedFonts']) assert.ok(source.includes(token),token);
});
test('Phase 19.5 completes production animation runtime',()=>{
  for(const token of ['yaposan-animation-end','CustomEvent','animation-end','cx=t=>','cy=t=>','version:"19.5"']) assert.ok(source.includes(token),token);
  assert.ok(types.includes('"19.5"'));
});
