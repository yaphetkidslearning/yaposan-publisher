import {existsSync,readFileSync} from "node:fs";
const R=p=>readFileSync(p,"utf8"),fail=m=>{throw new Error("Phase 91.8: "+m)};
for(const f of ["server/productPhotoBatches.ts","server/productPhotoBatchWorker.ts","release/phase91.8/batch-reliability-policy.json","release/phase91.8/production-test-plan.md","release/phase91.8/known-limitations.md","tests/phase918-batch-reliability-pure-white.test.mjs","PHASE91.8-BATCH-RELIABILITY-AND-PURE-WHITE-PRODUCTION.md"])if(!existsSync(f))fail("missing "+f);
const b=R("server/productPhotoBatches.ts");for(const t of ["MAX_IMAGES","MAX_ACTIVE_PER_USER","MAX_ACTIVE_PER_ORG","idempotencyKey","zipStorageKey","claimNextProductPhotoBatch","recoverStaleProductPhotoBatches","productPhotoBatchMetrics"])if(!b.includes(t))fail("batch engine missing "+t);
const py=R("services/background-removal/app.py");for(const t of ["post_export_white_audit","force_white_product_detail","white-on-white-detail-matte","engine_version\":\"91.8"])if(!py.includes(t))fail("image engine missing "+t);
const ui=R("src/app/product-photo-studio.tsx");for(const t of ["Create durable server batch","Recent Product Photo Batches","Download ZIP","up to 500 photos"])if(!ui.includes(t))fail("UI missing "+t);
const policy=JSON.parse(R("release/phase91.8/batch-reliability-policy.json"));if(policy.batch.maxImages!==500||policy.pureWhite.exactBackgroundCompliance!==1||policy.pureWhite.nonWhiteBackgroundPixelsMaximum!==0)fail("91.8 production policy weakened");
const cost=JSON.parse(R("release/phase91.0/cost-policy.json"));if(cost.paidPerImageProviderEnabled!==false||cost.paidProviderMonthlyBudgetUsd!==0||cost.autoOverage!==false)fail("paid API firewall changed");
console.log("Phase 91.8 durable batch + pure white production gate passed.");
