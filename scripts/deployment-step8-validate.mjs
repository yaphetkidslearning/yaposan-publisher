import fs from 'node:fs';
const requiredFiles = [
  'PRODUCTION-DEPLOYMENT-STEP8.md',
  'docs/operations/OPERATIONS-HANDBOOK.md',
  'docs/operations/DISASTER-RECOVERY-HANDBOOK.md',
  'docs/operations/ADMINISTRATOR-HANDBOOK.md',
  'docs/operations/USER-LAUNCH-GUIDE.md',
  'docs/operations/FINAL-LAUNCH-CHECKLIST.md',
  'docs/operations/PRODUCTION-ARCHITECTURE.md',
  'docs/operations/SECURITY-OPERATIONS.md',
  'deploy/templates/production-launch-evidence.example.json',
  'scripts/deployment-step8-certify.mjs'
];
const issues = [];
for (const file of requiredFiles) if (!fs.existsSync(file)) issues.push(`Missing ${file}`);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.version !== '1.0.0') issues.push('package version is not 1.0.0');
if (!pkg.scripts?.['deploy:step8:certify']) issues.push('Missing deploy:step8:certify script');
if (!pkg.scripts?.['deploy:step8:validate']) issues.push('Missing deploy:step8:validate script');
const certScript = fs.readFileSync('scripts/deployment-step8-certify.mjs', 'utf8');
if (!certScript.includes('CERTIFIED_FOR_PRODUCTION_LAUNCH')) issues.push('Certification status gate missing');
console.log(`Deployment Step 8 validation: ${issues.length} issue(s)`);
for (const issue of issues) console.log(`- ${issue}`);
process.exit(issues.length ? 1 : 0);
