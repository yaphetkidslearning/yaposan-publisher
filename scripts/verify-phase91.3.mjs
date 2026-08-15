import { existsSync, readFileSync, readdirSync } from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');
const fail=(m)=>{throw new Error(`Phase 91.3: ${m}`)};
const policyPath='release/phase91.3/completeness-policy.json';
if(!existsSync(policyPath)) fail(`missing ${policyPath}`);
const policy=JSON.parse(read(policyPath));
for(const area of policy.requiredSourceAreas){
  if(!existsSync(area)) fail(`missing source area ${area}`);
  if(readdirSync(area).length===0) fail(`empty source area ${area}`);
}
for(const f of policy.requiredProductPhotoFiles) if(!existsSync(f)) fail(`missing Product Photo file ${f}`);
for(const f of ['package.json','package-lock.json','.env.example','LICENSE','README.md','CONTRIBUTING.md','SECURITY.md','CODE_OF_CONDUCT.md']) if(!existsSync(f)) fail(`missing release file ${f}`);
const pkg=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));
const root=lock.packages?.['']??{};
for(const section of ['dependencies','devDependencies','optionalDependencies']){
  for(const [name,version] of Object.entries(pkg[section]??{})){
    if(root[section]?.[name]!==version) fail(`lockfile mismatch ${section}.${name}`);
  }
}
const env=read('.env.example');
for(const key of ['EXPO_PUBLIC_API_URL','DATABASE_URL','AI_CREDENTIAL_ENCRYPTION_KEY','STRIPE_SECRET_KEY','YAPOSAN_BG_STANDARD_MODEL','YAPOSAN_BG_DETAIL_MODEL']) if(!new RegExp(`^${key}=`,`m`).test(env)) fail(`.env.example missing ${key}`);
if(!/Never commit real credentials/i.test(env)) fail('.env.example missing credential safety warning');
const current=[
  'src/app/product-photo-studio.tsx','server/backgroundRemoval.ts','server/index.ts','services/background-removal/app.py','services/background-removal/README.md',
  'release/phase91.0/quality-targets.json','release/phase91.0/cost-policy.json','release/phase91.1/benchmark-schema.json','release/phase91.1/pilot-readiness.json',
  'PHASE91.0-PRODUCTION-PRODUCT-PHOTO-ENGINE.md','PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md','PHASE91.2-ORGANIZATION-NEUTRAL-PRODUCT-PHOTO-PLATFORM.md','PHASE91.3-COMPLETE-PRODUCT-PHOTO-RELEASE-INTEGRITY.md'
];
for(const f of current){const t=read(f); if(/good\s*will/i.test(t)) fail(`customer-specific branding found in ${f}`)}
const cost=JSON.parse(read('release/phase91.0/cost-policy.json'));
if(cost.paidFallbackEnabled===true) fail('paid provider fallback must not be enabled by default');
if(Number(cost.monthlyPaidApiBudgetUsd??0)!==0) fail('unexpected paid API budget must default to $0');
const pack=read('scripts/create-source-release.mjs');
for(const token of ['.env.example','PHASE91.3-COMPLETE-PRODUCT-PHOTO-RELEASE-INTEGRITY.md','tests/phase913-complete-product-photo-release.test.mjs','scripts/verify-phase91.3.mjs','release/phase91.3/completeness-policy.json']) if(!pack.includes(token)) fail(`source packager missing required 91.3 token ${token}`);
console.log('Phase 91.3 complete Product Photo release-integrity gate passed.');
