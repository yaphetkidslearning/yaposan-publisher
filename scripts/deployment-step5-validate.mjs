#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';

const required = [
  'scripts/post-cutover-verify.mjs',
  '.github/workflows/post-deploy-smoke.yml',
  'deployment/monitoring/alert-policy.example.json',
  'deployment/monitoring/launch-dashboard.md',
  'deployment/monitoring/incident-severity.md',
  'PRODUCTION-DEPLOYMENT-STEP5.md'
];
const issues = [];
for (const file of required) {
  try { await access(file); } catch { issues.push(`Missing ${file}`); }
}
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
for (const script of ['deploy:step5:validate', 'deploy:post-cutover']) {
  if (!pkg.scripts?.[script]) issues.push(`Missing package script ${script}`);
}
const workflow = await readFile('.github/workflows/post-deploy-smoke.yml', 'utf8').catch(() => '');
if (!workflow.includes('YAPOSAN_APP_URL') || !workflow.includes('YAPOSAN_API_URL')) issues.push('Post-deploy workflow is missing endpoint variables');
if (/(sk_live_|rk_live_|AKIA[0-9A-Z]{16}|BEGIN PRIVATE KEY)/.test(workflow)) issues.push('Possible credential embedded in workflow');
console.log(`Deployment Step 5 validation: ${issues.length} issue(s)`);
for (const issue of issues) console.error(`- ${issue}`);
process.exitCode = issues.length ? 1 : 0;
