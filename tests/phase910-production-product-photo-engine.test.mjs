import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("91.0 ships production photo engine artifacts",()=>{
  for(const f of ["src/app/product-photo-studio.tsx","src/components/ProductPhotoMaskTouchup.web.tsx","server/backgroundRemoval.ts","services/background-removal/app.py","release/phase91.0/quality-targets.json","release/phase91.0/cost-policy.json","release/phase91.0/organization-pilot.json","release/phase91.0/model-policy.json","PHASE91.0-PRODUCTION-PRODUCT-PHOTO-ENGINE.md"]) assert.equal(existsSync(f),true,`missing ${f}`);
});

test("91.0 uses multi-path local inference, difficulty routing, alpha matting, and automatic retry",()=>{
  const py=read("services/background-removal/app.py");
  for(const token of ["STANDARD_MODEL","DETAIL_MODEL","difficulty_score","alpha_matting","RETRY_SCORE","retried","quality_status","review_reasons"]) assert.ok(py.includes(token),`missing ${token}`);
  assert.match(py,/birefnet-general/);
});

test("organization workflow supports batch, review queue, max-quality retry, and manual keep/remove touch-up",()=>{
  const ui=read("src/app/product-photo-studio.tsx");
  assert.match(ui,/slice\(0,500\)/);
  assert.match(ui,/concurrency=3/);
  assert.match(ui,/Retry review\/failed at max quality/);
  assert.match(ui,/Touch-up/);
  const touch=read("src/components/ProductPhotoMaskTouchup.web.tsx");
  assert.match(touch,/Keep product/);
  assert.match(touch,/Remove background/);
  assert.match(touch,/drawImage\(original/);
  assert.match(touch,/clearRect/);
});

test("91.0 preserves a hard zero paid-provider default",()=>{
  const cost=JSON.parse(read("release/phase91.0/cost-policy.json"));
  assert.equal(cost.paidPerImageProviderEnabled,false);
  assert.equal(cost.paidProviderMonthlyBudgetUsd,0);
  assert.equal(cost.hardBudgetEnforced,true);
  assert.equal(cost.autoOverage,false);
  const server=read("server/backgroundRemoval.ts");
  assert.doesNotMatch(server,/api\.photoroom|removal\.ai|api\.remove\.bg/i);
});

test("quality target requires real 200-500 image evidence and staged rollout",()=>{
  const q=JSON.parse(read("release/phase91.0/quality-targets.json"));
  assert.ok(q.minimumBenchmarkImages>=200);
  assert.ok(q.recommendedBenchmarkImages>=500);
  assert.deepEqual(q.rolloutStages,[2,5,10,50]);
  assert.ok(q.targets.ordinaryHardGoodsAcceptableRateMinimum>=0.98);
  assert.ok(q.targets.clothingShoesBagsAcceptableRateMinimum>=0.97);
  assert.ok(q.targets.furFineEdgesAcceptableRateMinimum>=0.95);
  assert.ok(q.targets.glassReflectiveTransparentAcceptableRateMinimum>=0.90);
  assert.equal(q.targets.criticalOriginalFileLossMaximum,0);
  assert.equal(q.targets.unexpectedPaidApiSpendUsdMaximum,0);
  assert.equal(q.certifiedEquivalentToPhotoRoom,false);
  assert.equal(q.certifiedEquivalentToRemovalAI,false);
});

test("product pixels are not generatively replaced and model license review is explicit",()=>{
  const policy=JSON.parse(read("release/phase91.0/model-policy.json"));
  assert.match(policy.productPixelPolicy,/must not generatively replace/i);
  assert.equal(policy.standardModel.weightsBundled,false);
  assert.equal(policy.detailModel.weightsBundled,false);
  assert.match(policy.commercialReleaseRequirement,/exact model-weight license/i);
});

test("91.0 route exposes new quality and marketplace preset controls",()=>{
  const index=read("server/index.ts");
  for(const token of ["qualityMode","backgroundColor","paddingPercent","squareCanvas","preserveShadow"]) assert.ok(index.includes(token),`route missing ${token}`);
});

test("91.0 participates in normal and final release gates",()=>{
  const pkg=JSON.parse(read("package.json"));
  assert.match(pkg.scripts.test,/test:phase91\.0/);
  assert.ok(pkg.scripts["test:phase91.0"]);
  assert.ok(pkg.scripts["check:phase91.0"]);
  const verify=pkg.scripts["verify:phase91.0"]||"";
  for(const token of ["typecheck","npm test","build:web","check:phase90.19","check:phase91.0"]) assert.ok(verify.includes(token),`verify missing ${token}`);
});
