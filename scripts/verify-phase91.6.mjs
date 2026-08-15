import {existsSync,readFileSync} from "node:fs";
const R=p=>readFileSync(p,"utf8"), fail=m=>{throw new Error("Phase 91.6: "+m)};
for(const f of ["release/phase91.6/quality-certification-policy.json","release/phase91.6/benchmark-template.csv","release/phase91.6/visual-regression-manifest.json","release/phase91.6/load-certification.json","scripts/evaluate-phase91.6-quality.mjs","tests/phase916-commercial-quality.test.mjs","PHASE91.6-COMMERCIAL-PRODUCT-PHOTO-QUALITY.md"])if(!existsSync(f))fail("missing "+f);
const a=R("services/background-removal/app.py");
for(const t of ["specialized_matte","finished_candidate_rank","final_output_score","preserve_product_guard","/readiness","never-generate-or-replace-product-pixels","engine_version\":\"91.6"])if(!a.includes(t))fail("engine missing "+t);
const p=JSON.parse(R("release/phase91.6/quality-certification-policy.json"));if(p.maximumUnexpectedPaidApiSpendUsd!==0||p.criticalProductLossAllowed!==0||p.minimumImages<500)fail("certification safety policy weakened");
const cost=JSON.parse(R("release/phase91.0/cost-policy.json"));if(cost.paidPerImageProviderEnabled!==false||cost.paidProviderMonthlyBudgetUsd!==0||cost.autoOverage!==false)fail("paid API firewall changed");
if(/good\s*will/i.test(R("src/app/product-photo-studio.tsx")))fail("customer-specific branding returned");
console.log("Phase 91.6 commercial quality gate passed.");
