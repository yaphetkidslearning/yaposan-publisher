import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const engine = readFileSync(new URL('../src/utils/phase34CommercialReleaseEngine.ts', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../src/app/commercial-release.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/app/index.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Phase 34 registry covers packages 34.0 through 34.12', () => {
  for (let i = 0; i <= 12; i += 1) assert.match(engine, new RegExp(`id: "34\\.${i}"`));
  assert.match(engine, /Payments and Subscriptions/);
  assert.match(engine, /Real Social Publishing/);
  assert.match(engine, /Commercial Release Certification/);
});

test('Commercial workspace includes persistent release queues, channels and plans', () => {
  assert.match(screen, /yaposan\.phase34\.releaseJobs/);
  assert.match(screen, /Deploy Web/);
  assert.match(screen, /Queue Render/);
  assert.match(screen, /Queue Publish/);
  assert.match(screen, /Subscription Plans/);
});

test('Navigation and package metadata are upgraded', () => {
  assert.match(home, /href: "\/commercial-release"/);
  assert.equal(pkg.version, '34.0.0');
  assert.ok(pkg.scripts['test:phase34']);
  assert.ok(pkg.scripts['verify:phase34']);
});
