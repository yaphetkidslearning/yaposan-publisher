#!/usr/bin/env node
import fs from 'node:fs';
const required = [
  'scripts/deployment-step7-burn-in.mjs',
  'deployment/burn-in/BURN-IN-ACCEPTANCE-CRITERIA.md',
  'deployment/burn-in/BACKUP-AND-RESTORE-VERIFICATION.md',
  'deployment/burn-in/WORKER-AND-QUEUE-HEALTH.md',
  'deployment/burn-in/PRODUCTION-ACCEPTANCE-CHECKLIST.md',
  '.github/workflows/production-burn-in.yml',
  'PRODUCTION-DEPLOYMENT-STEP7.md'
];
const issues = required.filter(file => !fs.existsSync(file)).map(file => `Missing ${file}`);
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
for (const name of ['deploy:step7:burn-in','deploy:step7:validate']) if (!pkg.scripts?.[name]) issues.push(`Missing package script ${name}`);
const script = fs.readFileSync('scripts/deployment-step7-burn-in.mjs','utf8');
for (const token of ['BURN_IN_DURATION_MINUTES','availabilityPercent','EXPECTED_RELEASE_VERSION','/ready','/release']) if (!script.includes(token)) issues.push(`Burn-in script missing ${token}`);
console.log(`Deployment Step 7 validation: ${issues.length} issue(s)`);
for (const issue of issues) console.error(`- ${issue}`);
process.exit(issues.length ? 1 : 0);
