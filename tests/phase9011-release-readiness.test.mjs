import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const phaseDoc='PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md';
test('Phase 90.11 defines the four certification outcomes',()=>{const d=fs.readFileSync(phaseDoc,'utf8');for(const s of ['PASS','PASS WITH DOCUMENTED LIMITATION','BLOCKED','NOT APPLICABLE'])assert.ok(d.includes(s));});
test('full check covers exactly 35 launch gates',()=>{const s=fs.readFileSync('scripts/phase90.11-full-check.mjs','utf8');for(let i=1;i<=35;i++){const n=String(i).padStart(2,'0')+'-';assert.ok(s.includes(`'${n}`),`missing gate ${n}`)}});
test('production verifier remains read-only and HTTPS gated',()=>{const s=fs.readFileSync('scripts/verify-production.mjs','utf8');assert.match(s,/https:\/\//);assert.doesNotMatch(s,/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/i);assert.ok(s.includes('/robots.txt'));assert.ok(s.includes('/sitemap.xml'));});
test('Phase 90.4 and 90.9 security controls remain',()=>{const g=fs.readFileSync('.gitleaks.toml','utf8');const i=fs.readFileSync('.gitignore','utf8');assert.ok(g.includes('yaposan\\.[A-Za-z0-9._-]+'));assert.ok(!g.includes('A-Za-z0-9.*-'));assert.ok(i.includes('gitleaks-report.json'));assert.ok(i.includes('gitleaks-full-report.json'));assert.ok(fs.existsSync('scripts/verify-phase90.9.mjs'));});
test('full evidence artifact exists and has 35 gates',()=>{const f='release/phase90.11/full-certification.json';assert.ok(fs.existsSync(f));const j=JSON.parse(fs.readFileSync(f,'utf8'));assert.equal(j.gateCount,35);assert.equal(j.gates.length,35);});
test('AI privacy model is explicit',()=>{const s=fs.readFileSync('docs/release/phase90.11/AI-PRIVACY-AND-CONTENT-BOUNDARIES.md','utf8');assert.match(s,/free\/open source/i);assert.match(s,/bring-your-own-provider/i);assert.match(s,/prepaid Yaposan-hosted AI credits/i);});
test('local certification includes gitleaks, typecheck, tests, audit, SBOM, evidence, and full check',()=>{const s=fs.readFileSync('scripts/phase90.11-local-certification.ps1','utf8');for(const t of ['gitleaks git .','npm run typecheck','npm test','npm audit --audit-level=high','npm run sbom:phase90.11','npm run certify:phase90.11:evidence','npm run check:phase90.11:full'])assert.ok(s.includes(t),t);});
