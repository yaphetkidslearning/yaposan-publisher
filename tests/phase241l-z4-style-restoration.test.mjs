import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync(new URL('../src/app/index.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Phase 24.1L restores the real Phase 24.0Z4 component-based home', () => {
  assert.match(home, /const navItems/);
  assert.match(home, /const workspaces/);
  assert.match(home, /const publicationTypes/);
  assert.match(home, /const publishChannels/);
  assert.match(home, /styles\.tSidebar/);
  assert.match(home, /styles\.hero/);
});

test('Phase 24.1L removes the screenshot-stretch home implementation', () => {
  assert.doesNotMatch(home, /phase241k-reference-home\.png/);
  assert.doesNotMatch(home, /resizeMode="stretch"/);
  assert.doesNotMatch(home, /const hotspots/);
  assert.doesNotMatch(home, /scaleX = availableWidth/);
});

test('Phase 24.1L keeps key 24.1 routes available from the home navigation', () => {
  for (const route of ['/photo-studio', '/ai', '/projects', '/templates', '/brand', '/marketplace', '/automation', '/team', '/help', '/settings']) {
    assert.ok(home.includes(route), `missing route ${route}`);
  }
});

test('Phase 24.1L version is updated', () => {
  assert.equal(pkg.version, '24.1.13');
  assert.ok(pkg.scripts['verify:phase24.1l']);
});
