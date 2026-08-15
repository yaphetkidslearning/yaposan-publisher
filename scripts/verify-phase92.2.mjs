import fs from 'node:fs';
import path from 'node:path';

const mustExist = [
  '.github/SUPPORT.md',
  '.github/ISSUE_TEMPLATE/question.yml',
  '.github/DISCUSSION_TEMPLATE/ideas.yml',
  '.github/DISCUSSION_TEMPLATE/q-and-a.yml',
  'docs/MAINTAINER-PLAYBOOK.md',
  'docs/PUBLIC-RELEASE-CERTIFICATION.md',
  'THIRD_PARTY_NOTICES.md',
  'scripts/check-dependency-licenses.mjs',
];
for (const file of mustExist) {
  if (!fs.existsSync(file)) throw new Error(`Missing Phase 92.2 file: ${file}`);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.engines?.node !== '>=22 <23') throw new Error('package.json must pin the supported Node major to 22');
for (const script of ['licenses:check', 'test:phase92.2', 'check:phase92.2', 'public:preflight']) {
  if (!pkg.scripts?.[script]) throw new Error(`Missing package script: ${script}`);
}

const ci = fs.readFileSync('.github/workflows/community-ci.yml', 'utf8');
if (!ci.includes("node-version: '22'")) throw new Error('Community CI must use Node 22');
if (!ci.includes('npm ci')) throw new Error('Community CI must use npm ci');

const rootFiles = fs.readdirSync('.').filter((name) => fs.statSync(name).isFile());
const validationClutter = rootFiles.filter((name) => /(?:VALIDATION\.(?:txt|json)|PHASE24\.2[A-P]-README\.docx)$/i.test(name));
if (validationClutter.length) throw new Error(`Historical validation/docx clutter remains in root: ${validationClutter.join(', ')}`);

console.log(`Phase 92.2 repository/community verification passed. Root files: ${rootFiles.length}`);
