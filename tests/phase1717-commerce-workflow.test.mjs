import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js");
const source = fs.readFileSync(new URL("../src/utils/commerceStudioEngine.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const temp = path.join(os.tmpdir(), `commerce-${Date.now()}.cjs`);
fs.writeFileSync(temp, compiled);
const api = require(temp);

test("creates and validates marketplace listings", () => {
  const listing = api.generateListing({ title: "Premium Heavyweight Hoodie", description: "400 GSM brushed fleece hoodie", price: 69.99, quantity: 4, sku: "YOS-HOOD-001", imageUris: ["file://hoodie.png"], channels: ["ebay", "etsy"] });
  assert.deepEqual(api.validateListing(listing), []);
  const state = api.upsertListing(api.createCommerceState(), listing);
  assert.equal(state.listings[0].status, "ready");
});

test("runs batch publishing and updates analytics", async () => {
  const listing = api.generateListing({ title: "Premium Polo Shirt", description: "280 GSM pique cotton polo", price: 49.99, quantity: 2, sku: "YOS-POLO-001", imageUris: ["file://polo.png"], channels: ["ebay"] });
  const state = api.upsertListing(api.createCommerceState(), listing);
  const completed = await api.runBatchJob(api.createBatchJob(state.listings), state.listings);
  const updated = api.applyJobResult(state, completed);
  assert.equal(completed.status, "completed");
  assert.equal(updated.listings[0].status, "published");
  assert.equal(api.calculateCommerceMetrics(updated).publishedListings, 1);
});

test("exports marketplace compatible CSV", () => {
  const listing = api.generateListing({ title: "Product", description: "Description", price: 10, quantity: 1, sku: "SKU-1", imageUris: ["file://one.png"], channels: ["shopify"] });
  const csv = api.exportListingsCsv([listing]);
  assert.match(csv, /"sku","title","description"/);
  assert.match(csv, /SKU-1/);
  assert.match(csv, /shopify/);
});
