import { existsSync, readFileSync } from "node:fs";
function fail(m){ console.error(`Phase 91.1 check failed: ${m}`); process.exit(1); }
for (const f of [
  "release/phase91.1/benchmark-schema.json",
  "release/phase91.1/benchmark-template.csv",
  "release/phase91.1/pilot-readiness.json",
  "scripts/evaluate-phase91.1-benchmark.mjs",
  "tests/phase911-organization-quality-certification.test.mjs",
  "PHASE91.1-ORGANIZATION-QUALITY-CERTIFICATION-AND-PILOT-READINESS.md"
]) if(!existsSync(f)) fail(`missing ${f}`);
const p=JSON.parse(readFileSync("release/phase91.1/pilot-readiness.json","utf8"));
if(p.minimumBenchmarkImages<200) fail("benchmark minimum was weakened below 200");
if(p.maximumUnexpectedPaidApiSpendUsd!==0) fail("unexpected paid API spend must remain zero");
if(p.maximumCriticalProductPixelMutations!==0 || p.maximumOriginalFileLosses!==0) fail("critical product safety limits must remain zero");
if(p.certifiedEquivalentToPhotoRoom!==false || p.certifiedEquivalentToRemovalAI!==false) fail("competitor equivalence cannot be pre-certified");
const pkg=JSON.parse(readFileSync("package.json","utf8"));
if(!String(pkg.scripts.test||"").includes("test:phase91.1")) fail("top-level npm test does not include 91.1");
console.log("Phase 91.1 organization quality-certification and pilot-readiness structural gate passed. Real benchmark evidence is still required before a competitive-quality claim or 50-user rollout.");
