import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read=(p)=>readFileSync(p,'utf8');
const currentFiles=[
  'src/app/product-photo-studio.tsx',
  'server/backgroundRemoval.ts',
  'server/index.ts',
  'services/background-removal/app.py',
  'services/background-removal/README.md',
  'release/phase90.19/quality-benchmark.json',
  'release/phase91.0/quality-targets.json',
  'release/phase91.0/organization-pilot.json',
  'release/phase91.1/benchmark-schema.json',
  'release/phase91.1/pilot-readiness.json',
  'PHASE91.0-PRODUCTION-PRODUCT-PHOTO-ENGINE.md',
  'PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md',
  'PHASE91.2-ORGANIZATION-NEUTRAL-PRODUCT-PHOTO-PLATFORM.md'
];

test('91.2 required organization-neutral product photo files exist',()=>{
  for(const f of currentFiles) assert.equal(existsSync(f),true,`missing ${f}`);
});

test('current product photo surface contains no customer-specific name branding',()=>{
  for(const f of currentFiles){
    assert.doesNotMatch(read(f),/good\s*will/i,`${f} contains customer-specific branding`);
  }
});

test('product photo UI is Yaposan-branded and company-neutral',()=>{
  const ui=read('src/app/product-photo-studio.tsx');
  assert.match(ui,/Yaposan Product Photo Studio/);
  assert.match(ui,/Catalog white/);
  assert.match(ui,/marketplace-product/);
});

test('background removal API and service use generic marketplace preset',()=>{
  const server=read('server/backgroundRemoval.ts');
  const api=read('server/index.ts');
  const service=read('services/background-removal/app.py');
  for(const text of [server,api,service]){
    assert.match(text,/marketplace-product/);
    assert.doesNotMatch(text,/good\s*will-marketplace/i);
  }
});

test('pilot and benchmark evidence are reusable by any organization',()=>{
  const pilot=JSON.parse(read('release/phase91.0/organization-pilot.json'));
  const readiness=JSON.parse(read('release/phase91.1/pilot-readiness.json'));
  assert.equal(pilot.organizationPreset,'Marketplace Product Photos');
  assert.match(readiness.releaseRule,/tested organization workload/i);
});

test('top-level test and verifier include Phase 91.2',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.scripts.test,/test:phase91\.2/);
  assert.ok(pkg.scripts['check:phase91.2']);
  assert.match(pkg.scripts['verify:phase91.2'],/check:phase91\.2/);
});
