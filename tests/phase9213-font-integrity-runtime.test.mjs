import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const inspector=read('src/utils/fontFileInspector.ts');
const manager=read('src/utils/typographyManager.ts');
const modal=read('src/components/publisher/FontManagerModal.tsx');
const pkg=JSON.parse(read('package.json'));

test('92.13 identifies itself and preserves the professional font manager',()=>{
  assert.ok(Number.parseFloat(pkg.version) >= 92.13);
  assert.match(modal,/92\.13 font integrity & runtime hardening/);
});

test('92.13 runtime sources override same-name catalog placeholders',()=>{
  const catalog=manager.indexOf('for (const font of TYPOGRAPHY_FONTS)');
  const local=manager.indexOf('for (const font of localFontRecords(localFonts))');
  const project=manager.indexOf('for (const font of customFonts(project))');
  assert.ok(catalog>=0 && local>catalog && project>local);
  assert.match(manager,/byFamily\.set\(font\.family\.toLowerCase\(\), font\)/);
});

test('92.13 replacement suggestions require text compatibility',()=>{
  assert.match(manager,/filter\(\(font\) => !text\.trim\(\) \|\| fontSupportsText\(font, text\)\)/);
});

test('92.13 cmap parser excludes notdef mappings and validates controls',()=>{
  assert.match(inspector,/glyph !== 0/);
  assert.match(inspector,/startGlyph === 0/);
  assert.match(inspector,/Invalid TrueType collection font offset/);
  assert.match(inspector,/cp === 0x200c \|\| cp === 0x200d/);
  assert.match(inspector,/cp >= 0xfe00 && cp <= 0xfe0f/);
});
