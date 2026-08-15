import fs from 'node:fs';

const required = [
  'PHASE92.3-FULL-RUNTIME-AND-PRODUCTION-CERTIFICATION.md',
  'docs/PHASE92.3-PRODUCTION-CERTIFICATION.md',
  'tests/phase923-runtime-production-certification.test.mjs',
  'scripts/verify-phase92.3.mjs',
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing Phase 92.3 file: ${file}`);

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
for (const name of ['test:phase92.3','check:phase92.3','certify:production:ci','certify:production','certify:production:live','verify:phase92.3']) {
  if (!pkg.scripts?.[name]) throw new Error(`Missing package script: ${name}`);
}
const ci = pkg.scripts['certify:production:ci'];
for (const gate of ['typecheck','lint','phase91.11','phase91.12','phase91.13','phase91.14','phase91.15','phase92.0','phase92.1','phase92.2','phase92.3','licenses:check','build:web']) {
  if (!ci.includes(gate)) throw new Error(`Production CI certification is missing gate: ${gate}`);
}
if (!pkg.scripts['certify:production:live'].includes('verify:production')) throw new Error('Live certification must include production URL/API smoke verification');

for (const workflow of ['.github/workflows/phase75-ci.yml','.github/workflows/production-release.yml']) {
  const text=fs.readFileSync(workflow,'utf8');
  if (/npm install --ignore-scripts/.test(text)) throw new Error(`${workflow} still uses npm install --ignore-scripts`);
  if (!/npm ci --ignore-scripts/.test(text)) throw new Error(`${workflow} must use npm ci --ignore-scripts`);
}
const architecture=fs.readFileSync('docs/ARCHITECTURE.md','utf8');
if (/npm install/.test(architecture)) throw new Error('docs/ARCHITECTURE.md still documents npm install');
if (!/npm ci/.test(architecture)) throw new Error('docs/ARCHITECTURE.md must document npm ci');

const config=fs.readFileSync('server/config.ts','utf8');
if (/storageDriver:\s*"local"\s*\|\s*"s3"/.test(config) || /\|\s*"azure"/.test(config)) throw new Error('Unsupported S3/Azure drivers are still advertised in CloudConfig');
if (!/Supported drivers: local, r2/.test(config)) throw new Error('Unsupported storage values must fail clearly');

console.log('Phase 92.3 source/runtime certification structure passed.');
console.log('Note: external production services are only certified by npm run certify:production:live with real production URLs/credentials available to the runner.');
