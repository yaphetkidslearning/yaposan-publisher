import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const canonical = 'PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md';

test('top-level npm test aggregates release security suites', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.ok(pkg.scripts.test);
  for (const phase of ['90.5','90.6','90.7','90.8','90.9','90.11','90.12','90.13','90.14','90.15']) {
    assert.match(pkg.scripts.test, new RegExp(`test:phase${phase.replace('.', '\\.')}`));
  }
});

test('canonical Phase 90.11 document and bundled repair copy exist', () => {
  assert.ok(fs.existsSync(canonical));
  assert.ok(fs.existsSync(path.join('release','phase90.12',canonical)));
});

test('repair helper recreates canonical document when root copy is absent', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yaposan-9012-'));
  fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'release', 'phase90.12'), { recursive: true });
  fs.copyFileSync('scripts/ensure-phase90.11-canonical-doc.mjs', path.join(tmp, 'scripts', 'ensure-phase90.11-canonical-doc.mjs'));
  fs.copyFileSync(path.join('release','phase90.12',canonical), path.join(tmp,'release','phase90.12',canonical));
  execFileSync(process.execPath, ['scripts/ensure-phase90.11-canonical-doc.mjs'], { cwd: tmp, stdio: 'pipe' });
  assert.ok(fs.existsSync(path.join(tmp, canonical)));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('Phase 90.4 secret-scan protections remain intact', () => {
  const ignore = fs.readFileSync('.gitignore', 'utf8');
  assert.match(ignore, /gitleaks-report\.json/);
  assert.match(ignore, /gitleaks-full-report\.json/);
  assert.ok(fs.existsSync('.gitleaks.toml'));
});

test('strict Phase 90.11 release gate remains strict', () => {
  const fullCheck = fs.readFileSync('scripts/phase90.11-full-check.mjs', 'utf8');
  assert.match(fullCheck, /require-release-ready/);
  assert.match(fullCheck, /BLOCKED/);
});
