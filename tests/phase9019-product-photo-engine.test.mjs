import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");

test("Phase 90.19 ships the product-photo UI, server provider boundary, and self-hosted service",()=>{
  for(const f of ["src/app/product-photo-studio.tsx","server/backgroundRemoval.ts","services/background-removal/app.py","services/background-removal/Dockerfile","services/background-removal/README.md"]) assert.equal(existsSync(f),true,`missing ${f}`);
});

test("background removal is authenticated and routed through Yaposan",()=>{
  const index=read("server/index.ts");
  assert.match(index,/\/api\/v1\/image\/background-remove/);
  assert.ok(index.indexOf('const claims = verifyToken') < index.indexOf('/api/v1/image/background-remove'),"background removal route must be after access-token verification");
  assert.match(index,/runSelfHostedBackgroundRemoval/);
});

test("default cost policy cannot silently spend on Removal.AI or PhotoRoom",()=>{
  const policy=JSON.parse(read("release/phase90.19/cost-policy.json"));
  assert.equal(policy.paidPerImageProviderEnabled,false);
  assert.equal(policy.paidProviderMonthlyBudgetUsd,0);
  assert.equal(policy.perImagePaidApiCostUsd,0);
  const server=read("server/backgroundRemoval.ts");
  assert.doesNotMatch(server,/remove\.bg|removal\.ai|photoroom/i);
});

test("quality benchmark is honest and requires representative blind testing",()=>{
  const q=JSON.parse(read("release/phase90.19/quality-benchmark.json"));
  assert.ok(q.minimumSampleImages>=100);
  assert.equal(q.blindComparison,true);
  assert.equal(q.certifiedEquivalentToPhotoRoom,false);
  assert.equal(q.certifiedEquivalentToRemovalAI,false);
  assert.ok(q.acceptance.staffAcceptableRateMinimum>=0.95);
});

test("commercially risky model choices are not silently treated as free",()=>{
  const l=JSON.parse(read("release/phase90.19/model-license-review.json"));
  assert.equal(l.defaultModelFamily.weightsBundled,false);
  assert.match(l.defaultModelFamily.status,/review-required/);
  assert.ok(l.rejectedDefaultCandidates.some(x=>/BRIA/.test(x.name)));
  assert.ok(l.rejectedDefaultCandidates.some(x=>/imgly/.test(x.name)));
});

test("Photo Studio exposes Product Background Studio workflow",()=>{
  assert.match(read("src/app/photo-studio.tsx"),/Product background studio/);
});

test("Phase 90.19 is part of the normal and final verification gates",()=>{
  const pkg=JSON.parse(read("package.json"));
  assert.match(pkg.scripts.test,/test:phase90\.19/);
  const verify=pkg.scripts["verify:phase90.19"]||"";
  for(const token of ["typecheck","npm test","build:web","check:phase90.14","check:phase90.15","check:phase90.16","check:phase90.17","check:phase90.18","check:phase90.19"]) assert.ok(verify.includes(token),`missing ${token}`);
});
