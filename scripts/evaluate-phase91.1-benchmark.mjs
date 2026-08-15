#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const input = args.find((x) => !x.startsWith("--"));
const writeIndex = args.indexOf("--write");
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : undefined;
if (!input) {
  console.error("Usage: node scripts/evaluate-phase91.1-benchmark.mjs <benchmark.csv> [--write report.json]");
  process.exit(2);
}

const policy = JSON.parse(readFileSync("release/phase91.1/pilot-readiness.json", "utf8"));
const schema = JSON.parse(readFileSync("release/phase91.1/benchmark-schema.json", "utf8"));

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ""));
}

function bool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  throw new Error(`invalid boolean: ${v}`);
}
function num(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`invalid number: ${v}`);
  return n;
}
function rate(rows, pred) { return rows.length ? rows.filter(pred).length / rows.length : null; }
function categoryRows(rows, names) { const set = new Set(names); return rows.filter((r) => set.has(r.category)); }

const raw = readFileSync(resolve(input), "utf8");
const csv = parseCsv(raw);
if (csv.length < 2) { console.error("Benchmark CSV has no evidence rows."); process.exit(2); }
const header = csv[0].map((x) => x.trim());
for (const col of schema.requiredColumns) if (!header.includes(col)) { console.error(`Missing required column: ${col}`); process.exit(2); }
const rows = csv.slice(1).map((values, rowIndex) => {
  const r = Object.fromEntries(header.map((h, i) => [h, values[i] ?? ""]));
  try {
    return {
      imageId: r.image_id.trim(), category: r.category.trim(),
      yaposanAcceptable: bool(r.yaposan_acceptable), currentToolAcceptable: bool(r.current_tool_acceptable),
      blindPreference: r.blind_preference.trim(), yaposanStatus: r.yaposan_status.trim(),
      processingMs: num(r.processing_ms), manualTouchup: bool(r.manual_touchup),
      criticalProductPixelMutation: bool(r.critical_product_pixel_mutation), originalFileLoss: bool(r.original_file_loss),
      paidApiCostUsd: num(r.paid_api_cost_usd)
    };
  } catch (e) { throw new Error(`row ${rowIndex + 2}: ${e.message}`); }
});

const groups = {
  ordinaryHardGoods: categoryRows(rows, ["electronics","books","toys","housewares","shoes"]),
  clothingShoesBags: categoryRows(rows, ["clothing","shoes","bags"]),
  furniture: categoryRows(rows, ["furniture"]),
  fineEdges: categoryRows(rows, ["thin-straps","cables","fur","fine-edges"]),
  glassReflectiveTransparent: categoryRows(rows, ["glass","reflective","transparent"])
};
const totalPaid = rows.reduce((s, r) => s + r.paidApiCostUsd, 0);
const failures = [];
function need(ok, message) { if (!ok) failures.push(message); }
need(rows.length >= policy.minimumBenchmarkImages, `need at least ${policy.minimumBenchmarkImages} images; got ${rows.length}`);
const overall = rate(rows, (r) => r.yaposanAcceptable);
need(overall >= policy.minimumOverallAcceptableRate, `overall acceptable rate ${(overall*100).toFixed(2)}% < ${(policy.minimumOverallAcceptableRate*100).toFixed(0)}%`);
const autoPass = rate(rows, (r) => r.yaposanStatus === "pass");
const reviewFailure = rate(rows, (r) => r.yaposanStatus !== "pass");
need(autoPass >= policy.minimumAutoPassRate, `auto-pass rate ${(autoPass*100).toFixed(2)}% < ${(policy.minimumAutoPassRate*100).toFixed(0)}%`);
need(reviewFailure <= policy.maximumReviewPlusFailureRate, `review+failure rate ${(reviewFailure*100).toFixed(2)}% > ${(policy.maximumReviewPlusFailureRate*100).toFixed(0)}%`);
need(rows.filter((r) => r.criticalProductPixelMutation).length <= policy.maximumCriticalProductPixelMutations, "critical product-pixel mutation detected");
need(rows.filter((r) => r.originalFileLoss).length <= policy.maximumOriginalFileLosses, "original-file loss detected");
need(totalPaid <= policy.maximumUnexpectedPaidApiSpendUsd + 1e-9, `unexpected paid API spend $${totalPaid.toFixed(2)}`);
const categoryChecks = [
  ["ordinaryHardGoods", policy.minimumOrdinaryHardGoodsRate],
  ["clothingShoesBags", policy.minimumClothingShoesBagsRate],
  ["furniture", policy.minimumFurnitureRate],
  ["fineEdges", policy.minimumFineEdgesRate],
  ["glassReflectiveTransparent", policy.minimumGlassReflectiveTransparentRate]
];
for (const [name, minimum] of categoryChecks) {
  const rr = groups[name];
  if (!rr.length) failures.push(`missing benchmark evidence for ${name}`);
  else {
    const v = rate(rr, (r) => r.yaposanAcceptable);
    if (v < minimum) failures.push(`${name} acceptable rate ${(v*100).toFixed(2)}% < ${(minimum*100).toFixed(0)}%`);
  }
}
const avgMs = rows.reduce((s,r)=>s+r.processingMs,0)/rows.length;
const report = {
  phase: "91.1", status: failures.length ? "FAIL" : "PASS", evidenceRows: rows.length,
  overallAcceptableRate: overall, autoPassRate: autoPass, reviewPlusFailureRate: reviewFailure,
  manualTouchupRate: rate(rows, (r) => r.manualTouchup), averageProcessingMs: avgMs,
  totalPaidApiCostUsd: totalPaid,
  criticalProductPixelMutations: rows.filter((r)=>r.criticalProductPixelMutation).length,
  originalFileLosses: rows.filter((r)=>r.originalFileLoss).length,
  blindPreference: {
    yaposan: rows.filter((r)=>r.blindPreference==="yaposan").length,
    currentTool: rows.filter((r)=>r.blindPreference==="current-tool").length,
    both: rows.filter((r)=>r.blindPreference==="both").length,
    neither: rows.filter((r)=>r.blindPreference==="neither").length
  },
  categoryAcceptableRates: Object.fromEntries(Object.entries(groups).map(([k, rr]) => [k, rr.length ? rate(rr, (r)=>r.yaposanAcceptable) : null])),
  failures
};
console.log(JSON.stringify(report, null, 2));
if (writePath) writeFileSync(resolve(writePath), JSON.stringify(report, null, 2) + "\n");
process.exit(failures.length ? 1 : 0);
