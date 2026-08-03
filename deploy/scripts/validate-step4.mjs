import fs from 'node:fs';
const required=[
  '.github/workflows/production-release.yml',
  'render.yaml',
  'deploy/step4/temporary-urls.env.example',
  'deploy/step4/provider-secrets-handoff.env.example',
  'deploy/step4/dns-cutover-plan.json',
  'deploy/runbooks/DEPLOYMENT-STEP4-LIVE-ACCOUNT-EXECUTION.md',
  'deploy/runbooks/DNS-CUTOVER-AND-ROLLBACK.md',
  'deploy/scripts/hosted-smoke-test.mjs'
];
let failed=0;
for(const file of required){if(!fs.existsSync(file)){console.error(`Missing ${file}`);failed++;}}
const dns=JSON.parse(fs.readFileSync('deploy/step4/dns-cutover-plan.json','utf8'));
if(!Array.isArray(dns.domains)||dns.domains.length!==3){console.error('DNS plan must contain three domains');failed++;}
const secrets=fs.readFileSync('deploy/step4/provider-secrets-handoff.env.example','utf8');
if(/sk_live_|whsec_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}/.test(secrets)){console.error('Possible live credential detected');failed++;}
const workflow=fs.readFileSync('.github/workflows/production-release.yml','utf8');
for(const gate of ['npm ci','npm run typecheck','npm run test:rc12','npm run build:web']){if(!workflow.includes(gate)){console.error(`Workflow missing ${gate}`);failed++;}}
console.log(JSON.stringify({step:4,issues:failed,ok:failed===0}));
process.exit(failed?1:0);
