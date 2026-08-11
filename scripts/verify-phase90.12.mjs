import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/ensure-phase90.11-canonical-doc.mjs'], { stdio: 'inherit' });

const required = [
  'PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md',
  'PHASE90.12-CERTIFICATION-REPAIR-AND-FULL-RELEASE-GATE-FIXES.md',
  'release/phase90.12/PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md',
  'scripts/ensure-phase90.11-canonical-doc.mjs',
  'scripts/phase90.11-full-check.mjs',
  'scripts/phase90.12-local-certification.ps1',
  'tests/phase9012-certification-repair.test.mjs',
  '.gitleaks.toml',
  '.gitignore',
];
for (const f of required) {
  if (!fs.existsSync(f)) throw new Error(`Missing Phase 90.12 required file: ${f}`);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of ['test', 'repair:phase90.12', 'check:phase90.12', 'test:phase90.12', 'verify:phase90.12', 'certify:phase90.12:local']) {
  if (!pkg.scripts?.[name]) throw new Error(`Missing package script: ${name}`);
}
if (!pkg.scripts.test.includes('test:phase90.11') || !pkg.scripts.test.includes('test:phase90.12')) {
  throw new Error('Top-level npm test does not include Phase 90.11 and 90.12 suites.');
}

const ignore = fs.readFileSync('.gitignore', 'utf8');
for (const report of ['gitleaks-report.json', 'gitleaks-full-report.json']) {
  if (!ignore.includes(report)) throw new Error(`.gitignore no longer protects ${report}`);
}

console.log('Phase 90.12 certification repair static verification passed.');
