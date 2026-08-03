import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../src/app/template-ecosystem.tsx',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../src/templates/phase43ProfessionalTemplateEcosystem.ts',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('renders actual template elements in thumbnails',()=>{
  assert.match(app,/function TinyElement/);
  assert.match(app,/page\.elements/);
  assert.match(app,/TemplateThumbnail/);
  assert.doesNotMatch(app,/function MiniPreview/);
});

test('keeps the professional 32-category ecosystem',()=>{
  const ids=(engine.match(/\{"id":"/g)||[]).length;
  assert.equal(ids,32);
  assert.match(engine,/Array\.from\(\{length:5\}/);
});

test('registers rebuild version and verification command',()=>{
  assert.equal(pkg.version,'43.6.2-rebuild.2');
  assert.ok(pkg.scripts['test:phase43.6.2-rebuild']);
  assert.ok(pkg.scripts['verify:phase43.6.2-rebuild']);
});
