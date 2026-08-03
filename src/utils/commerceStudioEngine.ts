import type { CommerceMetrics, CommercePackageManifest, CommerceStudioState, ListingBatchJob, MarketplaceChannel, MarketplacePreset, ProductListing } from "../types/commerceStudio";

const now = () => Date.now();
const uid = (prefix: string) => `${prefix}-${now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CHANNELS: MarketplaceChannel[] = ["ebay", "etsy", "shopify", "amazon", "facebook", "instagram", "tiktok", "walmart", "pinterest"];

export const MARKETPLACE_PRESETS: Record<MarketplaceChannel, MarketplacePreset> = {
  ebay: { channel: "ebay", label: "eBay", titleLimit: 80, descriptionLimit: 500000, maxImages: 24, requiredFields: ["title", "description", "price", "quantity", "sku", "imageUris"], supportsLocalSimulation: true },
  etsy: { channel: "etsy", label: "Etsy", titleLimit: 140, descriptionLimit: 50000, maxImages: 20, requiredFields: ["title", "description", "price", "quantity", "imageUris"], supportsLocalSimulation: true },
  shopify: { channel: "shopify", label: "Shopify", titleLimit: 255, descriptionLimit: 100000, maxImages: 250, requiredFields: ["title", "description", "price", "sku"], supportsLocalSimulation: true },
  amazon: { channel: "amazon", label: "Amazon", titleLimit: 200, descriptionLimit: 2000, maxImages: 9, requiredFields: ["title", "description", "price", "quantity", "sku", "imageUris"], supportsLocalSimulation: true },
  facebook: { channel: "facebook", label: "Facebook Marketplace", titleLimit: 150, descriptionLimit: 5000, maxImages: 10, requiredFields: ["title", "description", "price", "imageUris"], supportsLocalSimulation: true },
  instagram: { channel: "instagram", label: "Instagram Shop", titleLimit: 150, descriptionLimit: 2200, maxImages: 10, requiredFields: ["title", "description", "price", "imageUris"], supportsLocalSimulation: true },
  tiktok: { channel: "tiktok", label: "TikTok Shop", titleLimit: 255, descriptionLimit: 5000, maxImages: 9, requiredFields: ["title", "description", "price", "quantity", "sku", "imageUris"], supportsLocalSimulation: true },
  walmart: { channel: "walmart", label: "Walmart Marketplace", titleLimit: 200, descriptionLimit: 4000, maxImages: 12, requiredFields: ["title", "description", "price", "quantity", "sku", "imageUris"], supportsLocalSimulation: true },
  pinterest: { channel: "pinterest", label: "Pinterest Catalog", titleLimit: 100, descriptionLimit: 500, maxImages: 1, requiredFields: ["title", "description", "price", "imageUris"], supportsLocalSimulation: true },
};

export function createCommerceState(): CommerceStudioState {
  return { listings: [], jobs: [], connections: CHANNELS.map((channel) => ({ channel, status: "disconnected" })) };
}

export function normalizeCommerceState(input?: Partial<CommerceStudioState> | null): CommerceStudioState {
  const base = createCommerceState();
  const existing = new Map((input?.connections ?? []).map((item) => [item.channel, item]));
  return {
    listings: Array.isArray(input?.listings) ? input!.listings!.map((item) => generateListing(item)) : [],
    jobs: Array.isArray(input?.jobs) ? input!.jobs! : [],
    connections: CHANNELS.map((channel) => existing.get(channel) ?? base.connections.find((item) => item.channel === channel)!),
  };
}

export function generateListing(input: Partial<ProductListing> & { imageUris?: string[] }): ProductListing {
  const title = (input.title ?? "New product listing").trim();
  const price = Number.isFinite(input.price) ? Math.max(0, Number(input.price)) : 0;
  const quantity = Number.isFinite(input.quantity) ? Math.max(0, Math.floor(Number(input.quantity))) : 1;
  const stamp = now();
  return {
    id: input.id ?? uid("listing"), title,
    description: input.description?.trim() || `Professional listing for ${title}. Add product details, condition, dimensions, materials, and shipping information before publishing.`,
    price, quantity, sku: input.sku?.trim() || `YAP-${stamp.toString().slice(-7)}`,
    category: input.category?.trim() || "Other",
    tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    imageUris: [...new Set(input.imageUris ?? [])],
    channels: [...new Set((input.channels ?? []).filter((channel): channel is MarketplaceChannel => CHANNELS.includes(channel)))],
    status: input.status ?? "draft", createdAt: input.createdAt ?? stamp, updatedAt: stamp,
  };
}

export function duplicateListing(listing: ProductListing): ProductListing {
  return generateListing({ ...listing, id: undefined, sku: `${listing.sku}-COPY`, title: `${listing.title} Copy`, status: "draft", createdAt: undefined });
}

export function validateListing(listing: ProductListing): string[] {
  const issues: string[] = [];
  if (listing.title.trim().length < 5) issues.push("Title must contain at least 5 characters.");
  if (!listing.description.trim()) issues.push("Description is required.");
  if (listing.price <= 0) issues.push("Price must be greater than zero.");
  if (listing.quantity < 1) issues.push("Quantity must be at least one.");
  if (!listing.sku.trim()) issues.push("SKU is required.");
  if (!listing.imageUris.length) issues.push("At least one product image is required.");
  if (!listing.channels.length) issues.push("Select at least one marketplace channel.");
  return issues;
}

export function validateListingForChannel(listing: ProductListing, channel: MarketplaceChannel): string[] {
  const preset = MARKETPLACE_PRESETS[channel];
  const issues = validateListing(listing).filter((item) => item !== "Select at least one marketplace channel.");
  if (listing.title.length > preset.titleLimit) issues.push(`${preset.label} title limit is ${preset.titleLimit} characters.`);
  if (listing.description.length > preset.descriptionLimit) issues.push(`${preset.label} description limit is ${preset.descriptionLimit} characters.`);
  if (listing.imageUris.length > preset.maxImages) issues.push(`${preset.label} allows up to ${preset.maxImages} images.`);
  if (!listing.channels.includes(channel)) issues.push(`${preset.label} is not selected for this listing.`);
  return [...new Set(issues)];
}

export function upsertListing(state: CommerceStudioState, listing: ProductListing): CommerceStudioState {
  const exists = state.listings.some((item) => item.id === listing.id);
  const next = { ...listing, updatedAt: now(), status: validateListing(listing).length ? "draft" as const : listing.status === "published" ? "published" as const : "ready" as const };
  return { ...state, listings: exists ? state.listings.map((item) => item.id === next.id ? next : item) : [next, ...state.listings] };
}

export function removeListing(state: CommerceStudioState, id: string): CommerceStudioState { return { ...state, listings: state.listings.filter((item) => item.id !== id) }; }
export function bulkAssignChannels(state: CommerceStudioState, ids: string[], channels: MarketplaceChannel[]): CommerceStudioState {
  const selected = new Set(ids); return { ...state, listings: state.listings.map((item) => selected.has(item.id) ? { ...item, channels: [...new Set(channels)], updatedAt: now() } : item) };
}
export function configureConnection(state: CommerceStudioState, channel: MarketplaceChannel, accountName: string): CommerceStudioState {
  return { ...state, connections: state.connections.map((item) => item.channel === channel ? { ...item, status: "configured", accountName, error: undefined } : item) };
}
export function disconnectConnection(state: CommerceStudioState, channel: MarketplaceChannel): CommerceStudioState {
  return { ...state, connections: state.connections.map((item) => item.channel === channel ? { channel, status: "disconnected" } : item) };
}
export function markConnectionSynced(state: CommerceStudioState, channel: MarketplaceChannel): CommerceStudioState {
  return { ...state, connections: state.connections.map((item) => item.channel === channel ? { ...item, status: "connected", lastSyncAt: now(), error: undefined } : item) };
}
export function findDuplicateSkus(listings: ProductListing[]): string[] {
  const seen = new Set<string>(); const duplicates = new Set<string>();
  for (const listing of listings) { const sku = listing.sku.trim().toLowerCase(); if (!sku) continue; if (seen.has(sku)) duplicates.add(listing.sku); else seen.add(sku); }
  return [...duplicates];
}
export function validateCommercePackage(listings: ProductListing[]): string[] {
  const issues = listings.flatMap((listing) => validateListing(listing).map((issue) => `${listing.sku || listing.id}: ${issue}`));
  for (const sku of findDuplicateSkus(listings)) issues.push(`Duplicate SKU: ${sku}`);
  return issues;
}

export function createBatchJob(listings: ProductListing[], channels?: MarketplaceChannel[]): ListingBatchJob {
  const selectedChannels = [...new Set(channels?.length ? channels : listings.flatMap((item) => item.channels))];
  return { id: uid("commerce-job"), listingIds: listings.map((item) => item.id), channels: selectedChannels, status: "queued", progress: 0, createdAt: now(), results: [] };
}

export async function runBatchJob(job: ListingBatchJob, listings: ProductListing[], onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<ListingBatchJob> {
  const tasks = listings.flatMap((listing) => job.channels.filter((channel) => listing.channels.includes(channel)).map((channel) => ({ listing, channel })));
  if (!tasks.length) return { ...job, status: "failed", progress: 100, completedAt: now(), results: [] };
  const results: ListingBatchJob["results"] = [];
  for (let index = 0; index < tasks.length; index += 1) {
    if (signal?.aborted) return { ...job, status: "cancelled", progress: Math.round((index / tasks.length) * 100), completedAt: now(), results };
    await new Promise((resolve) => setTimeout(resolve, 20));
    const { listing, channel } = tasks[index]; const issues = validateListingForChannel(listing, channel);
    results.push(issues.length ? { listingId: listing.id, channel, success: false, error: issues.join(" ") } : { listingId: listing.id, channel, success: true, externalId: `${channel}-${listing.sku}-${index + 1}` });
    onProgress?.(Math.round(((index + 1) / tasks.length) * 100));
  }
  return { ...job, status: results.every((item) => item.success) ? "completed" : "failed", progress: 100, completedAt: now(), results };
}

export function applyJobResult(state: CommerceStudioState, completed: ListingBatchJob): CommerceStudioState {
  const successfulIds = new Set(completed.results.filter((item) => item.success).map((item) => item.listingId));
  const failedIds = new Set(completed.results.filter((item) => !item.success).map((item) => item.listingId));
  return { ...state, jobs: [completed, ...state.jobs.filter((item) => item.id !== completed.id)], listings: state.listings.map((item) => successfulIds.has(item.id) ? { ...item, status: "published", updatedAt: now() } : failedIds.has(item.id) ? { ...item, status: "failed", updatedAt: now() } : item) };
}

export function calculateCommerceMetrics(state: CommerceStudioState): CommerceMetrics {
  const channelCounts = Object.fromEntries(CHANNELS.map((channel) => [channel, state.listings.filter((item) => item.channels.includes(channel)).length])) as Record<MarketplaceChannel, number>;
  return { totalListings: state.listings.length, readyListings: state.listings.filter((item) => item.status === "ready").length, publishedListings: state.listings.filter((item) => item.status === "published").length, failedListings: state.listings.filter((item) => item.status === "failed").length, totalInventoryValue: state.listings.reduce((total, item) => total + item.price * item.quantity, 0), channelCounts };
}

export function exportListingsCsv(listings: ProductListing[]): string {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [["sku", "title", "description", "price", "quantity", "category", "tags", "channels", "status"], ...listings.map((item) => [item.sku, item.title, item.description, item.price, item.quantity, item.category, item.tags.join("|"), item.channels.join("|"), item.status])];
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export function createCommercePackage(listings: ProductListing[]): CommercePackageManifest {
  return { schema: "yaposan-commerce-package", version: 1, exportedAt: now(), listingCount: listings.length, channels: [...new Set(listings.flatMap((item) => item.channels))], listings };
}
export function exportListingsJson(listings: ProductListing[]): string { return JSON.stringify(createCommercePackage(listings), null, 2); }
export function importListingsJson(raw: string): ProductListing[] {
  const parsed: unknown = JSON.parse(raw);
  const value = parsed as Partial<CommercePackageManifest> | ProductListing[];
  const listings = Array.isArray(value) ? value : value.schema === "yaposan-commerce-package" && Array.isArray(value.listings) ? value.listings : null;
  if (!listings) throw new Error("Invalid Yaposan commerce JSON package.");
  return listings.map((item) => generateListing(item));
}
