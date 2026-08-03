#!/usr/bin/env node
import fs from 'node:fs/promises';

const env = process.env;
const api = (env.YAPOSAN_API_URL || 'https://api.yaposan.com').replace(/\/$/, '');
const app = (env.YAPOSAN_APP_URL || 'https://app.yaposan.com').replace(/\/$/, '');
const durationMinutes = Math.max(1, Number(env.BURN_IN_DURATION_MINUTES || 60));
const intervalSeconds = Math.max(30, Number(env.BURN_IN_INTERVAL_SECONDS || 60));
const maxFailures = Math.max(0, Number(env.BURN_IN_MAX_FAILURES || 3));
const metricsToken = env.METRICS_TOKEN || '';
const reportPath = env.BURN_IN_REPORT_PATH || 'deployment/burn-in/latest-report.json';
const expectedVersion = env.EXPECTED_RELEASE_VERSION || '1.0.0';
const timeoutMs = Math.max(1000, Number(env.BURN_IN_REQUEST_TIMEOUT_MS || 15000));

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - started, text, json };
  } catch (error) {
    return { ok: false, status: 0, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const samples = [];
const iterations = Math.max(1, Math.ceil((durationMinutes * 60) / intervalSeconds));
for (let i = 0; i < iterations; i += 1) {
  const at = new Date().toISOString();
  const [web, live, ready, release, metrics] = await Promise.all([
    request(app), request(`${api}/live`), request(`${api}/ready`), request(`${api}/release`),
    metricsToken ? request(`${api}/metrics`, { headers: { authorization: `Bearer ${metricsToken}` } }) : Promise.resolve({ ok: null, status: null, latencyMs: null, skipped: true })
  ]);
  const version = release.json?.version || release.json?.release?.version || null;
  samples.push({ at, web, live, ready, release, metrics, version, versionMatches: version === expectedVersion });
  console.log(`[${i + 1}/${iterations}] web=${web.status} live=${live.status} ready=${ready.status} release=${release.status} version=${version || 'unknown'}`);
  if (i + 1 < iterations) await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
}

const required = samples.flatMap(s => [s.web, s.live, s.ready, s.release]);
const failures = required.filter(r => !r.ok).length + samples.filter(s => !s.versionMatches).length;
const latencies = required.filter(r => Number.isFinite(r.latencyMs)).map(r => r.latencyMs);
const summary = {
  generatedAt: new Date().toISOString(), app, api, expectedVersion, durationMinutes, intervalSeconds,
  sampleCount: samples.length, requestCount: required.length, failures,
  availabilityPercent: required.length ? Number((((required.length - required.filter(r => !r.ok).length) / required.length) * 100).toFixed(3)) : 0,
  latencyMs: { average: latencies.length ? Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length) : 0, p95: percentile(latencies,95), maximum: latencies.length ? Math.max(...latencies) : 0 },
  accepted: failures <= maxFailures
};
await fs.mkdir(new URL('.', `file://${process.cwd()}/${reportPath}`).pathname, { recursive: true }).catch(()=>{});
await fs.writeFile(reportPath, JSON.stringify({ summary, samples }, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.accepted ? 0 : 1);
