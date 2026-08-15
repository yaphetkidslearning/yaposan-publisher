import fs from 'node:fs';

const required = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'docs/ARCHITECTURE.md',
  'docs/ROADMAP.md',
  'docs/GOOD-FIRST-ISSUES.md',
  '.github/ISSUE_TEMPLATE/accessibility.yml',
  '.github/ISSUE_TEMPLATE/documentation.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'PUBLIC-REPOSITORY-CERTIFICATION.md',
  'tests/phase9119-open-source-community-readiness.test.mjs',
  'PHASE91.19-OPEN-SOURCE-COMMUNITY-LAUNCH-READINESS.md',
];

let failed = false;
for (const path of required) {
  if (!fs.existsSync(path)) {
    console.error(`MISSING ${path}`);
    failed = true;
  } else {
    console.log(`OK ${path}`);
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of ['dev', 'dev:web', 'check', 'test:community', 'open-source:preflight', 'test:phase91.19', 'check:phase91.19', 'verify:phase91.19']) {
  if (!pkg.scripts?.[name]) {
    console.error(`MISSING package script ${name}`);
    failed = true;
  } else {
    console.log(`OK package script ${name}`);
  }
}

const architecture = fs.readFileSync('docs/ARCHITECTURE.md', 'utf8');
for (const term of ['Trust boundaries', 'EXPO_PUBLIC_', 'server/', 'database/', 'tests/', 'Local AI', 'Bring-your-own-provider']) {
  if (!architecture.includes(term)) {
    console.error(`ARCHITECTURE missing ${term}`);
    failed = true;
  }
}

const firstIssues = fs.readFileSync('docs/GOOD-FIRST-ISSUES.md', 'utf8');
const numberedSeeds = (firstIssues.match(/^\d+\./gm) || []).length;
if (numberedSeeds < 15) {
  console.error(`Only ${numberedSeeds} good-first-issue seeds found`);
  failed = true;
} else {
  console.log(`OK ${numberedSeeds} good-first-issue seeds`);
}

if (failed) process.exit(1);
console.log('Phase 91.19 open-source community readiness static gate passed.');
