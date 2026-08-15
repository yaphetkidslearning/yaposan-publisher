import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('README gives newcomers a short contributor path', () => {
  const s = read('README.md');
  for (const term of ['Community quick start', 'docs/ARCHITECTURE.md', 'docs/ROADMAP.md', 'docs/GOOD-FIRST-ISSUES.md', 'npm run dev:web', 'npm run test:community']) {
    assert.match(s, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('architecture guide documents repository map and secret boundaries', () => {
  const s = read('docs/ARCHITECTURE.md');
  for (const term of ['src/app/', 'src/components/', 'server/', 'database/', 'EXPO_PUBLIC_', 'Stripe', 'hosted AI-provider keys']) {
    assert.match(s, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('community roadmap avoids pretending to promise release dates', () => {
  const s = read('docs/ROADMAP.md');
  assert.match(s, /Now: make contribution easy and safe/);
  assert.match(s, /good first issue/);
  assert.match(s, /help wanted/);
  assert.match(s, /not a promise of dates/i);
});

test('good first issue seeds are numerous and bounded', () => {
  const s = read('docs/GOOD-FIRST-ISSUES.md');
  assert.ok((s.match(/^\d+\./gm) || []).length >= 15);
  assert.match(s, /acceptance criteria/i);
  assert.match(s, /Do not label broad requests/i);
});

test('GitHub issue forms cover accessibility and documentation', () => {
  assert.match(read('.github/ISSUE_TEMPLATE/accessibility.yml'), /Accessibility issue/);
  assert.match(read('.github/ISSUE_TEMPLATE/accessibility.yml'), /assistive technology/);
  assert.match(read('.github/ISSUE_TEMPLATE/documentation.yml'), /Documentation improvement/);
});

test('public certification remains explicitly gated by real GitHub and history checks', () => {
  const s = read('PUBLIC-REPOSITORY-CERTIFICATION.md');
  assert.match(s, /Gitleaks/);
  assert.match(s, /branch protection/);
  assert.match(s, /secret scanning/);
  assert.match(s, /good first issue/);
  assert.doesNotMatch(s, /\[x\].*Gitleaks/i);
});

test('package exposes beginner-friendly community commands', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const name of ['dev', 'dev:web', 'check', 'test:community', 'open-source:preflight', 'test:phase91.19', 'check:phase91.19', 'verify:phase91.19']) {
    assert.equal(typeof pkg.scripts[name], 'string');
    assert.ok(pkg.scripts[name].length > 0);
  }
});
