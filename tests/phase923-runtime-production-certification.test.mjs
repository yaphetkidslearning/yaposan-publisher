import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');

test('92.3 has one consolidated local/CI production certification gate',()=>{
  const pkg=JSON.parse(read('package.json'));
  const gate=pkg.scripts['certify:production:ci']||'';
  for (const required of ['typecheck','lint','phase91.11','phase91.12','phase91.13','phase91.14','phase91.15','phase92.0','phase92.1','phase92.2','phase92.3','licenses:check','build:web']) {
    assert.match(gate,new RegExp(required.replaceAll('.','\\.')));
  }
  assert.equal(pkg.scripts['certify:production'], 'npm run certify:production:ci');
  assert.match(pkg.scripts['certify:production:live']||'',/verify:production/);
});

test('deterministic CI install is used in active release workflows',()=>{
  for (const file of ['.github/workflows/phase75-ci.yml','.github/workflows/production-release.yml']) {
    const workflow=read(file);
    assert.match(workflow,/npm ci --ignore-scripts/);
    assert.doesNotMatch(workflow,/npm install --ignore-scripts/);
  }
});

test('architecture onboarding uses reproducible npm ci',()=>{
  const doc=read('docs/ARCHITECTURE.md');
  assert.match(doc,/npm ci/);
  assert.doesNotMatch(doc,/npm install/);
});

test('storage configuration only advertises implemented drivers',()=>{
  const config=read('server/config.ts');
  assert.match(config,/storageDriver: "local" \| "r2"/);
  assert.doesNotMatch(config,/storageDriver: "local" \| "s3"/);
  assert.match(config,/Unsupported STORAGE_DRIVER=/);
});

test('92.3 documentation separates source certification from live certification',()=>{
  const doc=read('docs/PHASE92.3-PRODUCTION-CERTIFICATION.md');
  for (const phrase of ['certify:production','certify:production:live','does not claim','PostgreSQL','Redis','R2','Stripe','OpenAI','backup','TLS']) {
    assert.match(doc,new RegExp(phrase,'i'));
  }
});
