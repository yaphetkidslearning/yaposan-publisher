import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');

test('91.3 restores all essential release/source areas',()=>{
  for(const area of ['src/app','server','services/background-removal','scripts','tests','release']){
    assert.equal(existsSync(area),true,`missing ${area}`);
    assert.ok(readdirSync(area).length>0,`empty ${area}`);
  }
  for(const f of ['package.json','package-lock.json','.env.example','LICENSE','README.md','CONTRIBUTING.md','SECURITY.md','CODE_OF_CONDUCT.md']) assert.equal(existsSync(f),true,`missing ${f}`);
});

test('safe environment example covers web, database, AI, payments, and Product Photo configuration',()=>{
  const env=read('.env.example');
  for(const key of ['EXPO_PUBLIC_API_URL','DATABASE_URL','AI_CREDENTIAL_ENCRYPTION_KEY','STRIPE_SECRET_KEY','YAPOSAN_BG_STANDARD_MODEL','YAPOSAN_BG_DETAIL_MODEL']) assert.match(env,new RegExp(`^${key}=`,`m`));
  assert.match(env,/Never commit real credentials/i);
});

test('package lock remains synchronized for all direct dependencies',()=>{
  const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const root=lock.packages?.['']??{};
  for(const section of ['dependencies','devDependencies','optionalDependencies']) for(const [name,version] of Object.entries(pkg[section]??{})) assert.equal(root[section]?.[name],version,`${section}.${name}`);
});

test('production Product Photo and quality evidence files are all present',()=>{
  const policy=JSON.parse(read('release/phase91.3/completeness-policy.json'));
  for(const f of policy.requiredProductPhotoFiles) assert.equal(existsSync(f),true,`missing ${f}`);
});

test('current Product Photo release remains customer-neutral',()=>{
  for(const f of ['src/app/product-photo-studio.tsx','server/backgroundRemoval.ts','services/background-removal/app.py','PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md','PHASE91.2-ORGANIZATION-NEUTRAL-PRODUCT-PHOTO-PLATFORM.md','PHASE91.3-COMPLETE-PRODUCT-PHOTO-RELEASE-INTEGRITY.md']) assert.doesNotMatch(read(f),/good\s*will/i,f);
});

test('paid provider fallback cannot silently create an API bill',()=>{
  const cost=JSON.parse(read('release/phase91.0/cost-policy.json'));
  assert.notEqual(cost.paidFallbackEnabled,true);
  assert.equal(Number(cost.monthlyPaidApiBudgetUsd??0),0);
});

test('source packager and top-level release gate include Phase 91.3',()=>{
  const pack=read('scripts/create-source-release.mjs');
  for(const f of ['release/phase91.3/completeness-policy.json','scripts/verify-phase91.3.mjs','tests/phase913-complete-product-photo-release.test.mjs','PHASE91.3-COMPLETE-PRODUCT-PHOTO-RELEASE-INTEGRITY.md']) assert.match(pack,new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.scripts.test,/test:phase91\.3/);
  assert.ok(pkg.scripts['check:phase91.3']);
  assert.match(pkg.scripts['verify:phase91.3'],/check:phase91\.3/);
});
