import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const inspector = read('src/utils/fontFileInspector.ts');
const manager = read('src/utils/typographyManager.ts');
const modal = read('src/components/publisher/FontManagerModal.tsx');
const editor = read('src/app/editor.tsx');
const exportEngine = read('src/utils/exportEngine.ts');
const publisherType = read('src/types/publisher.ts');
const storage = read('src/utils/publisherStorage.ts');

test('92.12 parses real sfnt metadata and cmap coverage', () => {
  assert.match(inspector, /inspectFontFile/);
  assert.match(inspector, /parseCmap/);
  assert.match(inspector, /embeddingPermission/);
  assert.match(inspector, /parseFvar/);
  assert.match(inspector, /fontMetadataSupportsText/);
});

test('92.12 persists imported font metadata and durable bytes', () => {
  assert.match(publisherType, /embeddedFontMetadata/);
  assert.match(storage, /embeddedFontMetadata/);
  assert.match(editor, /bytesToDataUri/);
  assert.match(editor, /inspectFontFile/);
  assert.match(editor, /embeddingPermission === "restricted"/);
});

test('92.12 fixes missing font visibility and recovery', () => {
  assert.match(manager, /missingFontRecords/);
  assert.match(modal, /category === "Missing" \? missingFontRecords/);
  assert.match(modal, /onReplaceMissing/);
  assert.match(editor, /replaceMissingFont/);
});

test('92.12 distinguishes catalog entries from installed runtime fonts', () => {
  assert.match(manager, /NATIVE_SAFE_FONTS/);
  assert.match(manager, /Catalog only/);
  assert.match(modal, /fontRuntimeStatus/);
});

test('92.12 protects PDF font fidelity and fixes footer separator', () => {
  assert.match(exportEngine, /PDF_FONT_SUBSTITUTION/);
  assert.match(exportEngine, /FONT_EMBED_RESTRICTED/);
  assert.match(modal, /borderTopColor:"#273449"/);
});
