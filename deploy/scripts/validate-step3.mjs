import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  '.github/workflows/production-release.yml',
  'render.yaml',
  'deploy/github/REQUIRED-SECRETS.md',
  'deploy/runbooks/RENDER-BLUEPRINT-LAUNCH.md',
  'deploy/runbooks/CLOUDFLARE-DNS-R2-LAUNCH.md',
  'deploy/runbooks/ROLLBACK.md',
  'deploy/scripts/hosted-smoke-test.mjs'
];
const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing ${file}`);
}
const workflow = fs.readFileSync(path.join(root, '.github/workflows/production-release.yml'), 'utf8');
const requiredWorkflowCommands = [
  { label: 'dependency install with scripts disabled', pattern: /npm\s+(?:ci|install)\s+--ignore-scripts/ },
  { label: 'npm run typecheck', pattern: /npm\s+run\s+typecheck/ },
  { label: 'npm run test:rc12', pattern: /npm\s+run\s+test:rc12/ },
  { label: 'npm run build:web', pattern: /npm\s+run\s+build:web/ },
];
for (const command of requiredWorkflowCommands) {
  if (!command.pattern.test(workflow)) errors.push(`Workflow missing: ${command.label}`);
}
const render = fs.readFileSync(path.join(root, 'render.yaml'), 'utf8');
for (const service of ['yaposan-web','yaposan-api','yaposan-export-worker','yaposan-redis','yaposan-postgres']) {
  if (!render.includes(service)) errors.push(`Render blueprint missing ${service}`);
}
const forbidden = [/sk-[A-Za-z0-9]{20,}/, /whsec_[A-Za-z0-9]+/, /re_[A-Za-z0-9]{20,}/, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/];
for (const file of required.concat(['render.yaml'])) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of forbidden) if (pattern.test(text)) errors.push(`Possible credential in ${file}`);
}
if (errors.length) {
  console.error(errors.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log('Deployment Step 3 validation passed: repository, CI, runbooks, and credential boundaries are present.');
