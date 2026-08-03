import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const collection = fs.readFileSync(new URL('src/templates/phase4363Flagship20.ts', root), 'utf8');
const ecosystem = fs.readFileSync(new URL('src/templates/phase43ProfessionalTemplateEcosystem.ts', root), 'utf8');
const screen = fs.readFileSync(new URL('src/app/template-ecosystem.tsx', root), 'utf8');

test('contains exactly twenty flagship specifications', () => {
  const ids = [...collection.matchAll(/id:\"p4363-[^\"]+\"/g)];
  assert.equal(ids.length, 20);
  assert.match(collection, /PHASE4363_FLAGSHIP_20=specs\.map\(make\)/);
});

test('covers twenty distinct categories and editable production templates', () => {
  const cats = [...collection.matchAll(/category:\"([^\"]+)\"/g)].map(m=>m[1]);
  assert.equal(new Set(cats).size, 20);
  assert.match(collection, /editable:true/);
  assert.match(collection, /qualityScore:100/);
  assert.match(collection, /imageUri:uri/);
});

test('template center renders actual image elements and flagship cards', () => {
  assert.match(ecosystem, /PHASE4363_FLAGSHIP_20/);
  assert.match(screen, /<Image source=\{\{uri:element\.imageUri\}\}/);
  assert.match(screen, /20 flagship templates/);
  assert.match(screen, /1 flagship design/);
});
