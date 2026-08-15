import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const read = (p) => readFileSync(p, "utf8");

test("91.1 ships real benchmark and pilot-certification artifacts", () => {
  for (const f of [
    "release/phase91.1/benchmark-schema.json",
    "release/phase91.1/benchmark-template.csv",
    "release/phase91.1/pilot-readiness.json",
    "scripts/evaluate-phase91.1-benchmark.mjs",
    "PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md"
  ]) assert.equal(existsSync(f), true, `missing ${f}`);
});

test("91.1 evidence gate requires 200+ images and zero critical loss/mutation/spend", () => {
  const p = JSON.parse(read("release/phase91.1/pilot-readiness.json"));
  assert.ok(p.minimumBenchmarkImages >= 200);
  assert.ok(p.recommendedBenchmarkImages >= 500);
  assert.deepEqual(p.requiredRolloutStages, [2,5,10,50]);
  assert.equal(p.maximumCriticalProductPixelMutations, 0);
  assert.equal(p.maximumOriginalFileLosses, 0);
  assert.equal(p.maximumUnexpectedPaidApiSpendUsd, 0);
  assert.equal(p.certifiedEquivalentToPhotoRoom, false);
  assert.equal(p.certifiedEquivalentToRemovalAI, false);
});

test("91.1 benchmark evaluator rejects insufficient evidence instead of falsely certifying", () => {
  const r = spawnSync(process.execPath, ["scripts/evaluate-phase91.1-benchmark.mjs", "tests/fixtures/phase911-small-valid.csv"], { encoding: "utf8" });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /\"status\": \"FAIL\"/);
  assert.match(r.stdout, /need at least 200 images/);
});

test("91.1 benchmark schema captures blind comparison, status, cost, and product safety", () => {
  const s = JSON.parse(read("release/phase91.1/benchmark-schema.json"));
  for (const col of ["blind_preference","yaposan_status","manual_touchup","critical_product_pixel_mutation","original_file_loss","paid_api_cost_usd"]) assert.ok(s.requiredColumns.includes(col));
});

test("91.1 remains zero-paid-provider by default and preserves 91.0 product engine", () => {
  const cost = JSON.parse(read("release/phase91.0/cost-policy.json"));
  assert.equal(cost.paidPerImageProviderEnabled, false);
  assert.equal(cost.paidProviderMonthlyBudgetUsd, 0);
  assert.equal(existsSync("services/background-removal/app.py"), true);
  assert.equal(existsSync("src/app/product-photo-studio.tsx"), true);
});

test("91.1 participates in normal and final release gates", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.test, /test:phase91\.1/);
  assert.ok(pkg.scripts["benchmark:phase91.1"]);
  assert.ok(pkg.scripts["test:phase91.1"]);
  assert.ok(pkg.scripts["check:phase91.1"]);
  const v = pkg.scripts["verify:phase91.1"] || "";
  for (const token of ["typecheck","npm test","build:web","check:phase91.0","check:phase91.1"]) assert.ok(v.includes(token), `verify missing ${token}`);
});


test("source release packager cannot silently omit Phase 91.1 evidence gates", () => {
  const pack = read("scripts/create-source-release.mjs");
  for (const token of ["release/phase91.1/benchmark-schema.json","release/phase91.1/pilot-readiness.json","scripts/evaluate-phase91.1-benchmark.mjs","PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md"]) assert.ok(pack.includes(token), `packager missing ${token}`);
});
