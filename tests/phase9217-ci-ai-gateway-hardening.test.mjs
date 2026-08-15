import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const network = fs.readFileSync(new URL('../server/aiNetworkSecurity.ts', import.meta.url), 'utf8');
const phase71 = fs.readFileSync(new URL('./phase71-commercial-ai-platform.test.ts', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('92.17 release metadata and verification are present', () => {
  assert.equal(pkg.version, '92.17');
  assert.match(pkg.scripts['test:phase92.17'], /phase9217-ci-ai-gateway-hardening/);
  assert.match(pkg.scripts['verify:phase92.17'], /test:phase71/);
  assert.match(pkg.scripts['verify:phase92.17'], /test:phase92\.17/);
});

test('malformed AI provider URLs become a stable provider validation error', () => {
  assert.match(network, /try\{current=new URL\(rawUrl\)\}catch\{throw new Error\('AI_PROVIDER_ENDPOINT_INVALID'\)\}/);
});

test('Phase 71 provider fallback test is self-contained and does not mock global fetch', () => {
  assert.match(phase71, /http\.createServer/);
  assert.match(phase71, /127\.0\.0\.1/);
  assert.doesNotMatch(phase71, /globalThis\.fetch\s*=/);
  assert.match(phase71, /AI_PROVIDER_MAX_RETRIES='0'/);
});
