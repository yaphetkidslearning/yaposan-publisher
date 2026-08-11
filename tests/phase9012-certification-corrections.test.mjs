import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('top-level npm test script exists and aggregates release security suites', () => {
  assert.equal(typeof pkg.scripts?.test, 'string');
  for (const name of ['test:phase90.5','test:phase90.6','test:phase90.7','test:phase90.8','test:phase90.9','test:phase90.11','test:phase90.12']) {
    assert.ok(pkg.scripts.test.includes(`npm run ${name}`), name);
  }
});

test('canonical Phase 90.11 document exists at the exact verifier path', () => {
  assert.ok(fs.existsSync('PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md'));
});

test('Phase 90.12 verifier and local certification scripts are present', () => {
  assert.ok(fs.existsSync('scripts/verify-phase90.12.mjs'));
  assert.ok(fs.existsSync('scripts/phase90.12-local-certification.ps1'));
});

test('Phase 90.4 secret-scan protections remain intact', () => {
  const g = fs.readFileSync('.gitleaks.toml', 'utf8');
  const i = fs.readFileSync('.gitignore', 'utf8');
  assert.ok(g.includes('yaposan\\.[A-Za-z0-9._-]+'));
  assert.ok(!g.includes('A-Za-z0-9.*-'));
  assert.ok(i.includes('gitleaks-report.json'));
  assert.ok(i.includes('gitleaks-full-report.json'));
});

test('strict release readiness cannot silently pass blocked certification', () => {
  const full = JSON.parse(fs.readFileSync('release/phase90.11/full-certification.json', 'utf8'));
  assert.equal(full.gateCount, 35);
  if (full.blocked > 0 || (full.criticalBlocked?.length ?? 0) > 0) assert.equal(full.releaseReady, false);
});
