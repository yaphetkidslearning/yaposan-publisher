import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const engine = readFileSync(new URL('../src/utils/phase32EnterpriseProductionEngine.ts', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../src/app/enterprise-production.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/app/index.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Phase 32 package registry covers 32.0 through 32.12', () => {
  for (let i = 0; i <= 12; i += 1) assert.match(engine, new RegExp(`id: "32\\.${i}"`));
  assert.match(engine, /Live Collaboration/);
  assert.match(engine, /Cloud Rendering/);
  assert.match(engine, /Enterprise Security/);
});

test('Enterprise production workspace includes persistent queues, versions and audit trail', () => {
  assert.match(screen, /yaposan\.phase32\.jobs/);
  assert.match(screen, /yaposan\.phase32\.versions/);
  assert.match(screen, /yaposan\.phase32\.audit/);
  assert.match(screen, /Queue Render/);
  assert.match(screen, /Queue Publish/);
  assert.match(screen, /Create Snapshot/);
});

test('Navigation and package metadata are upgraded', () => {
  assert.match(home, /href: "\/enterprise-production"/);
  assert.equal(pkg.version, '32.0.0');
  assert.ok(pkg.scripts['test:phase32']);
  assert.ok(pkg.scripts['verify:phase32']);
});
