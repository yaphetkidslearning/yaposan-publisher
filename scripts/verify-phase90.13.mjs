import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/ensure-phase90.11-canonical-doc.mjs'], { stdio: 'inherit' });
const required = [
  'PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md',
  'release/phase90.13/phase90.11-certification-template.md',
  'scripts/ensure-phase90.11-canonical-doc.mjs',
  'scripts/verify-phase90.13.mjs',
  'tests/phase9013-windows-packaging.test.mjs',
  '.gitleaks.toml',
];
for (const f of required) if (!fs.existsSync(f)) throw new Error(`Missing Phase 90.13 required file: ${f}`);
const ignored = fs.readFileSync('.gitignore','utf8');
for (const f of ['gitleaks-report.json','gitleaks-full-report.json']) if (!ignored.includes(f)) throw new Error(`Missing ignore protection: ${f}`);
console.log('Phase 90.13 Windows-safe packaging and certification repair check passed.');
