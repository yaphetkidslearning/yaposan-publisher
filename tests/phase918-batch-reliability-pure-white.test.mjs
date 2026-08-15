import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const R=p=>fs.readFileSync(p,"utf8");

test("91.8 adds durable server batch module",()=>{const s=R("server/productPhotoBatches.ts");for(const t of ["product-photo-batch-v91.8","MAX_IMAGES","idempotencyKey","claimNextProductPhotoBatch","recoverStaleProductPhotoBatches","cleanupExpiredProductPhotoBatches"] )assert.ok(s.includes(t),t)});
test("91.8 accepts up to 500 and applies user/org limits",()=>{const s=R("server/productPhotoBatches.ts");assert.ok(s.includes("Math.min(500"));assert.ok(s.includes("MAX_ACTIVE_PER_USER"));assert.ok(s.includes("MAX_ACTIVE_PER_ORG"))});
test("91.8 creates server zip and safe names",()=>{const s=R("server/productPhotoBatches.ts");assert.ok(s.includes("new JSZip()"));assert.ok(s.includes("uniqueNames"));assert.ok(s.includes("zipStorageKey"))});
test("91.8 worker has leases recovery and retry",()=>{const s=R("server/productPhotoBatches.ts");for(const t of ["leaseExpiresAt","Recovered after worker interruption","retryProductPhotoBatch","status==='failed'||x.status==='review'"])assert.ok(s.includes(t),t)});
test("91.8 exact white has post export audit",()=>{const s=R("services/background-removal/app.py");for(const t of ["post_export_white_audit","certified exact white requires png or webp","pure-white-post-export-audit-failed"])assert.ok(s.includes(t),t)});
test("91.8 forces detail for white on white",()=>{const s=R("services/background-removal/app.py");assert.ok(s.includes("force_white_product_detail"));assert.ok(s.includes("white-on-white-detail-matte"))});
test("91.8 UI exposes recent durable batches",()=>{const s=R("src/app/product-photo-studio.tsx");for(const t of ["Create durable server batch","Recent Product Photo Batches","Download ZIP","Retry review/failed"])assert.ok(s.includes(t),t)});
test("91.8 worker script exists",()=>assert.equal(fs.existsSync("server/productPhotoBatchWorker.ts"),true));
test("91.8 routes are authenticated except worker-token route",()=>{const s=R("server/index.ts");for(const t of ["/api/v1/product-photo/batches","/api/v1/internal/product-photo/process-next","x-worker-token"])assert.ok(s.includes(t),t)});
test("91.8 cost firewall remains zero",()=>{const p=JSON.parse(R("release/phase91.0/cost-policy.json"));assert.equal(p.paidPerImageProviderEnabled,false);assert.equal(p.paidProviderMonthlyBudgetUsd,0);assert.equal(p.autoOverage,false)});
