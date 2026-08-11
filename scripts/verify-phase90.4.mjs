#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const checkOnly = process.argv.includes('--check-only');

function fail(message, code = 1) {
  console.error(`Phase 90.4 verification failed: ${message}`);
  process.exit(code);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });

  if (result.error) {
    return { status: null, error: result.error, stdout: '', stderr: '' };
  }

  return {
    status: result.status,
    error: null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

const config = readFileSync(resolve(projectRoot, '.gitleaks.toml'), 'utf8');
const gitignore = readFileSync(resolve(projectRoot, '.gitignore'), 'utf8');

const requiredConfigFragments = [
  '[extend]',
  'useDefault = true',
  '[allowlist]',
  'regexTarget = "match"',
  'yaposan\\.[A-Za-z0-9.*-]+',
  '0123456789abcdef0123456789abcdef',
  'PHASE56_CAPABILITIES',
  'REPLACE_WITH_[A-Z0-9_]+',
  'https://app\\.yaposan\\.com',
  'https://api\\.yaposan\\.com',
];

for (const fragment of requiredConfigFragments) {
  if (!config.includes(fragment)) {
    fail(`.gitleaks.toml is missing required fragment: ${fragment}`);
  }
}

for (const ignoredReport of ['gitleaks-report.json', 'gitleaks-full-report.json']) {
  const ignored = gitignore
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(ignoredReport);
  if (!ignored) {
    fail(`.gitignore must include ${ignoredReport}`);
  }
}

console.log('Phase 90.4 static security configuration checks passed.');

if (checkOnly) {
  console.log('Check-only mode: Git-history scan skipped.');
  process.exit(0);
}

const gitCheck = run('git', ['rev-parse', '--is-inside-work-tree']);
if (gitCheck.error) {
  fail(`Git is not available: ${gitCheck.error.message}`);
}
if (gitCheck.status !== 0 || gitCheck.stdout.trim() !== 'true') {
  fail('run this command from the real Yaposan Git repository; a source ZIP has no Git history.');
}

const gitleaksVersion = run('gitleaks', ['version']);
if (gitleaksVersion.error) {
  fail(`Gitleaks is not available on PATH: ${gitleaksVersion.error.message}`);
}
if (gitleaksVersion.status !== 0) {
  fail(`unable to read Gitleaks version: ${gitleaksVersion.stderr.trim() || 'unknown error'}`);
}
console.log(`Gitleaks: ${gitleaksVersion.stdout.trim() || gitleaksVersion.stderr.trim()}`);

console.log('Running full Git-history scan: gitleaks git . --config .gitleaks.toml');
const scan = run('gitleaks', ['git', '.', '--config', '.gitleaks.toml'], { inherit: true });

if (scan.error) {
  fail(`unable to launch Gitleaks: ${scan.error.message}`);
}

if (scan.status === 0) {
  console.log('Phase 90.4 Gitleaks certification PASSED: no non-allowlisted findings remain.');
  process.exit(0);
}

if (scan.status === 1) {
  console.error('Phase 90.4 Gitleaks certification did not pass: findings remain.');
  console.error('Do NOT broaden the allowlist. Inspect only the remaining findings and classify them individually.');
  process.exit(1);
}

fail(`Gitleaks exited with status ${scan.status}.`, scan.status ?? 1);
