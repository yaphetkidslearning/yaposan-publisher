import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, 'utf8');

test('community support and discussion intake files exist', () => {
  assert.ok(exists('.github/SUPPORT.md'));
  assert.ok(exists('.github/ISSUE_TEMPLATE/question.yml'));
  assert.ok(exists('.github/DISCUSSION_TEMPLATE/ideas.yml'));
  assert.ok(exists('.github/DISCUSSION_TEMPLATE/q-and-a.yml'));
});

test('maintainer and public release certification guidance exists', () => {
  assert.match(read('docs/MAINTAINER-PLAYBOOK.md'), /Pull requests/i);
  assert.match(read('docs/PUBLIC-RELEASE-CERTIFICATION.md'), /Git history/i);
  assert.match(read('THIRD_PARTY_NOTICES.md'), /third-party/i);
});

test('public CI uses the supported Node version and reproducible installs', () => {
  const ci = read('.github/workflows/community-ci.yml');
  assert.match(ci, /node-version: '22'/);
  assert.match(ci, /npm ci/);
});

test('root does not contain historical validation and legacy docx clutter', () => {
  const files = fs.readdirSync('.').filter((name) => fs.statSync(name).isFile());
  assert.equal(files.filter((name) => /VALIDATION\.(txt|json)$/i.test(name)).length, 0);
  assert.equal(files.filter((name) => /^PHASE24\.2[A-P]-README\.docx$/i.test(name)).length, 0);
});
