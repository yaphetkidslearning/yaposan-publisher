import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/app/ai.tsx', import.meta.url),'utf8');
test('AI workspace cards have press handlers',()=>{
  assert.match(source,/onPress=\{\(\)=>router\.push\(tool\.route as never\)\}/);
});
test('all AI workspace routes are wired',()=>{
  for (const route of ['/editor','/image-editor','/photo-studio','/project-diagnostics','/brand']) assert.ok(source.includes(`route: "${route}"`));
});
test('empty prompt gives visible validation',()=>{
  assert.ok(source.includes('Enter a prompt or choose Use example first.'));
});
