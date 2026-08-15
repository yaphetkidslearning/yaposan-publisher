import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("public open-source baseline files are present",()=>{
  for(const f of ["LICENSE","CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md",".env.example",".github/PULL_REQUEST_TEMPLATE.md",".github/dependabot.yml"]) assert.equal(existsSync(f),true,`missing ${f}`);
});

test("package lock root contains every direct dependency",()=>{
  const pkg=JSON.parse(read("package.json")); const lock=JSON.parse(read("package-lock.json")); const root=lock.packages?.[""]??{};
  for(const section of ["dependencies","devDependencies","optionalDependencies"]) for(const [name,version] of Object.entries(pkg[section]??{})) assert.equal(root[section]?.[name],version,`${section}.${name} missing or mismatched in lockfile`);
});

test("safe environment example documents required public configuration",()=>{
  const env=read(".env.example");
  for(const key of ["EXPO_PUBLIC_API_URL","DATABASE_URL","AI_CREDENTIAL_ENCRYPTION_KEY","STRIPE_SECRET_KEY"]) assert.match(env,new RegExp(`^${key}=`,`m`));
  assert.match(env,/Never commit real credentials/i);
});

test("source packager excludes bulk and validates required source paths",()=>{
  const s=read("scripts/create-source-release.mjs");
  for(const token of ["node_modules","dist",".expo","coverage","REQUIRED_ARCHIVE_PATHS","Refusing incomplete source archive"]) assert.match(s,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});

test("external open-source evidence is not falsely certified",()=>{
  const e=JSON.parse(read("release/phase90.17/open-source-release-evidence.json"));
  assert.ok(Object.values(e.externalEvidence).every(v=>v===false));
});

test("top-level release gate includes Phase 90.17",()=>{
  const pkg=JSON.parse(read("package.json")); assert.match(pkg.scripts.test,/test:phase90\.17/); assert.match(pkg.scripts["verify:phase90.17"],/check:phase90\.17/);
});
