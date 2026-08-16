import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const codeql = fs.readFileSync(".github/workflows/codeql.yml", "utf8");
const rc12 = fs.readFileSync("tests/rc12-final-production-certification.test.ts", "utf8");

test("92.18 release metadata is synchronized", () => {
  assert.equal(pkg.version, "92.18");
  assert.equal(lock.version, "92.18");
  assert.equal(lock.packages[""].version, "92.18");
  assert.equal(fs.readFileSync("release/CURRENT_CREATIVE_PLATFORM_PHASE", "utf8").trim(), "92.18");
});

test("92.18 declares CI lint dependencies", () => {
  assert.equal(pkg.devDependencies.eslint, "9.39.5");
  assert.equal(pkg.devDependencies["eslint-config-expo"], "57.0.1");
  assert.equal(lock.packages[""].devDependencies.eslint, "9.39.5");
  assert.equal(lock.packages[""].devDependencies["eslint-config-expo"], "57.0.1");
});

test("92.18 CodeQL token can read Actions metadata", () => {
  assert.match(codeql, /permissions:\s*[\s\S]*actions: read/);
  assert.match(codeql, /security-events: write/);
});

test("92.18 RC12 validates synchronized phase metadata instead of pinning 1.0.0", () => {
  assert.match(rc12, /release package and platform phase labels are synchronized/);
  assert.doesNotMatch(rc12, /assert\.equal\(pkg\.version, "1\.0\.0"\)/);
});
