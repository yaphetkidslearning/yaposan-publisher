import { existsSync, readFileSync } from 'node:fs';
const files=[
  'src/app/product-photo-studio.tsx',
  'server/backgroundRemoval.ts',
  'services/background-removal/app.py',
  'release/phase91.0/organization-pilot.json',
  'release/phase91.1/benchmark-schema.json',
  'release/phase91.1/pilot-readiness.json',
  'tests/phase912-organization-neutral-product-photo.test.mjs',
  'PHASE91.2-ORGANIZATION-NEUTRAL-PRODUCT-PHOTO-PLATFORM.md'
];
for(const f of files){ if(!existsSync(f)) throw new Error(`Phase 91.2 missing ${f}`); }
for(const f of files){
  const text=readFileSync(f,'utf8');
  if(/good\s*will/i.test(text)) throw new Error(`Phase 91.2 customer-specific branding found in ${f}`);
}
console.log('Phase 91.2 organization-neutral Product Photo Platform structural gate passed.');
