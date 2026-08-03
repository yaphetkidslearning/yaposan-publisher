import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('all main workspace placeholders are replaced', () => {
  for (const file of ['ai','templates','brand','team','account','help','settings']) {
    const source = read(`src/app/${file}.tsx`);
    assert.doesNotMatch(source, /This section will be added in a later phase/i);
  }
});

test('Design and Table Tools are wired to real ribbon renderers', () => {
  const source = read('src/components/publisher/EditorToolbar.tsx');
  assert.match(source, /const renderDesign = \(\) =>/);
  assert.match(source, /activeTab === "Design" && renderDesign\(\)/);
  assert.match(source, /activeTab === "Table Tools" && renderTableTools\(\)/);
  assert.doesNotMatch(source, /renderGeneric/);
});

test('AI Studio provides prompt generation and connected workspaces', () => {
  const source = read('src/app/ai.tsx');
  for (const term of ['Generate Image','Design Generator','Product Studio','Document Assistant','Prompt history','Open Publisher']) {
    assert.match(source, new RegExp(term));
  }
});
