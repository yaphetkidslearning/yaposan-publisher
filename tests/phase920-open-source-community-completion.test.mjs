import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const exists=p=>fs.existsSync(new URL(`../${p}`,import.meta.url));
for (const p of ["GOVERNANCE.md","CONTRIBUTORS.md","docs/COMMUNITY-SUPPORT.md","docs/OPEN-SOURCE-BOUNDARY.md","docs/ASSET-LICENSE-POLICY.md","docs/GITHUB-LAUNCH-CHECKLIST.md",".github/labels.yml",".github/workflows/community-ci.yml",".github/workflows/dependency-review.yml"]) test(`community artifact: ${p}`,()=>assert.ok(exists(p)));
test("community CI uses npm ci",()=>assert.match(fs.readFileSync(new URL("../.github/workflows/community-ci.yml",import.meta.url),"utf8"),/npm ci/));
