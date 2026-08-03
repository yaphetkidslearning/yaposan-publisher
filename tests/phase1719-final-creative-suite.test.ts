import test from "node:test";
import assert from "node:assert/strict";
import { CHANNELS, MARKETPLACE_PRESETS, bulkAssignChannels, createCommercePackage, createCommerceState, duplicateListing, exportListingsJson, generateListing, importListingsJson, normalizeCommerceState, validateListingForChannel } from "../src/utils/commerceStudioEngine";

test("Phase 17.19 includes all nine local marketplace channels", () => {
  assert.deepEqual(CHANNELS, ["ebay", "etsy", "shopify", "amazon", "facebook", "instagram", "tiktok", "walmart", "pinterest"]);
  assert.equal(Object.keys(MARKETPLACE_PRESETS).length, 9);
});

test("legacy commerce state is migrated with missing connections", () => {
  const migrated = normalizeCommerceState({ connections: [{ channel: "ebay", status: "configured", accountName: "Legacy" }], listings: [], jobs: [] });
  assert.equal(migrated.connections.length, 9);
  assert.equal(migrated.connections.find((item) => item.channel === "ebay")?.accountName, "Legacy");
  assert.equal(migrated.connections.find((item) => item.channel === "pinterest")?.status, "disconnected");
});

test("commerce JSON package round trips listings", () => {
  const listing = generateListing({ title: "Premium Heavyweight Hoodie", description: "400 GSM brushed fleece hoodie", price: 59.99, quantity: 5, sku: "HD-400", imageUris: ["file:///hoodie.png"], channels: ["facebook", "instagram", "tiktok"] });
  const packageData = createCommercePackage([listing]);
  assert.equal(packageData.schema, "yaposan-commerce-package");
  assert.equal(packageData.listingCount, 1);
  const imported = importListingsJson(exportListingsJson([listing]));
  assert.equal(imported[0].sku, "HD-400");
  assert.deepEqual(imported[0].channels, ["facebook", "instagram", "tiktok"]);
});

test("bulk channel assignment and duplicate listing work", () => {
  const listing = generateListing({ title: "Product Example", description: "Complete description", price: 10, quantity: 1, sku: "SKU-1", imageUris: ["image.png"], channels: ["ebay"] });
  const state = { ...createCommerceState(), listings: [listing] };
  const assigned = bulkAssignChannels(state, [listing.id], CHANNELS);
  assert.equal(assigned.listings[0].channels.length, 9);
  const duplicate = duplicateListing(listing);
  assert.notEqual(duplicate.id, listing.id);
  assert.equal(duplicate.status, "draft");
});

test("channel-specific validation applies marketplace limits", () => {
  const listing = generateListing({ title: "X".repeat(101), description: "Description", price: 10, quantity: 1, sku: "PIN-1", imageUris: ["image.png"], channels: ["pinterest"] });
  assert.ok(validateListingForChannel(listing, "pinterest").some((issue) => issue.includes("100")));
});
