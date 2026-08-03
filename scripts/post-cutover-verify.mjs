#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';

const appUrl = process.env.YAPOSAN_APP_URL || 'https://app.yaposan.com';
const apiUrl = process.env.YAPOSAN_API_URL || 'https://api.yaposan.com';
const expectedVersion = process.env.EXPECTED_RELEASE_VERSION || '1.0.0';
const metricsToken = process.env.METRICS_TOKEN || '';
const timeoutMs = Number(process.env.POST_CUTOVER_TIMEOUT_MS || 15000);
const output = process.env.POST_CUTOVER_REPORT || 'DEPLOYMENT-STEP5-LIVE-REPORT.json';

const checks = [];
async function request(name, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow', ...options, signal: controller.signal });
    const text = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    const result = { name, url, ok: response.ok, status: response.status, durationMs: Date.now() - started, headers, body: text.slice(0, 10000) };
    checks.push(result);
    return result;
  } catch (error) {
    const result = { name, url, ok: false, status: 0, durationMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
    checks.push(result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function requireHeader(check, header) {
  if (!check.headers?.[header]) {
    check.ok = false;
    check.validationError = `${header} header is missing`;
  }
}

const app = await request('web-home', appUrl);
requireHeader(app, 'content-security-policy');
requireHeader(app, 'x-content-type-options');
requireHeader(app, 'strict-transport-security');

const live = await request('api-live', `${apiUrl}/live`);
const health = await request('api-health', `${apiUrl}/health`);
const ready = await request('api-ready', `${apiUrl}/ready`);
const release = await request('api-release', `${apiUrl}/release`);

try {
  const payload = JSON.parse(release.body || '{}');
  const actualVersion = payload.version || payload.release?.version;
  if (actualVersion !== expectedVersion) {
    release.ok = false;
    release.validationError = `Expected release ${expectedVersion}, received ${actualVersion || 'unknown'}`;
  }
} catch {
  release.ok = false;
  release.validationError = 'Release endpoint did not return valid JSON';
}

if (metricsToken) {
  const metrics = await request('api-metrics', `${apiUrl}/metrics`, { headers: { authorization: `Bearer ${metricsToken}` } });
  if (!/yaposan_|http_/i.test(metrics.body || '')) {
    metrics.ok = false;
    metrics.validationError = 'Metrics response did not contain expected metric names';
  }
}

const failed = checks.filter((check) => !check.ok);
const report = {
  generatedAt: new Date().toISOString(),
  appUrl,
  apiUrl,
  expectedVersion,
  passed: checks.length - failed.length,
  failed: failed.length,
  status: failed.length === 0 ? 'pass' : 'fail',
  checks
};
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, report: output }, null, 2));
process.exitCode = failed.length === 0 ? 0 : 1;
