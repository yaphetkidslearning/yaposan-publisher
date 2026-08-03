export type AssetKind = "image" | "vector" | "font" | "icon" | "template" | "document" | "video" | "audio";
export type AssetStatus = "available" | "missing" | "modified" | "offline";
export type AssetSource = "local" | "linked" | "embedded" | "cloud" | "stock";
export type AssetVersion = { id: string; createdAt: number; label: string; checksum: string; size: number; author?: string };
export type ManagedAsset = {
  id: string; name: string; kind: AssetKind; source: AssetSource; uri?: string; mimeType?: string;
  size: number; width?: number; height?: number; tags: string[]; collectionIds: string[];
  status: AssetStatus; checksum: string; createdAt: number; updatedAt: number; versions: AssetVersion[];
  license?: { name: string; url?: string; expiresAt?: number; attribution?: string };
  metadata?: Record<string, string | number | boolean>;
};
export type AssetCollection = { id: string; name: string; description?: string; assetIds: string[]; color?: string };
export type FontRecord = { id: string; family: string; style: string; source: AssetSource; status: AssetStatus; license?: string; postScriptName?: string; embedded: boolean };
export type AssetLibrary = { assets: ManagedAsset[]; collections: AssetCollection[]; fonts: FontRecord[]; updatedAt: number };
export type AssetIssue = { id: string; severity: "error" | "warning" | "info"; assetId?: string; message: string; fix: string };
export type AssetAuditReport = { score: number; totalAssets: number; linkedAssets: number; embeddedAssets: number; missingAssets: number; duplicateGroups: string[][]; issues: AssetIssue[] };

const normalize = (value: string) => value.trim().toLowerCase();
export const createAssetId = (prefix = "asset") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
export const checksumText = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export function createManagedAsset(input: Partial<ManagedAsset> & Pick<ManagedAsset, "name" | "kind">): ManagedAsset {
  const now = Date.now();
  const checksum = input.checksum ?? checksumText(`${input.name}|${input.uri ?? ""}|${input.size ?? 0}`);
  return {
    id: input.id ?? createAssetId(), name: input.name.trim() || "Untitled asset", kind: input.kind,
    source: input.source ?? "embedded", uri: input.uri, mimeType: input.mimeType, size: Math.max(0, input.size ?? 0),
    width: input.width, height: input.height, tags: [...new Set((input.tags ?? []).map(normalize).filter(Boolean))],
    collectionIds: [...new Set(input.collectionIds ?? [])], status: input.status ?? "available", checksum,
    createdAt: input.createdAt ?? now, updatedAt: input.updatedAt ?? now,
    versions: input.versions ?? [{ id: createAssetId("version"), createdAt: now, label: "Initial", checksum, size: Math.max(0, input.size ?? 0) }],
    license: input.license, metadata: input.metadata ?? {},
  };
}

export function addAssetVersion(asset: ManagedAsset, update: { label: string; checksum?: string; size?: number; author?: string; uri?: string }): ManagedAsset {
  const now = Date.now();
  const checksum = update.checksum ?? checksumText(`${asset.name}|${update.uri ?? asset.uri ?? ""}|${update.size ?? asset.size}|${now}`);
  const version: AssetVersion = { id: createAssetId("version"), createdAt: now, label: update.label.trim() || "Updated", checksum, size: Math.max(0, update.size ?? asset.size), author: update.author };
  return { ...asset, uri: update.uri ?? asset.uri, size: version.size, checksum, status: "available", updatedAt: now, versions: [version, ...asset.versions] };
}

export function restoreAssetVersion(asset: ManagedAsset, versionId: string): ManagedAsset {
  const version = asset.versions.find((item) => item.id === versionId);
  if (!version) return asset;
  return { ...asset, checksum: version.checksum, size: version.size, status: "available", updatedAt: Date.now() };
}

export function searchAssets(assets: ManagedAsset[], query: string, options: { kind?: AssetKind; tags?: string[]; source?: AssetSource; status?: AssetStatus } = {}): ManagedAsset[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const tags = (options.tags ?? []).map(normalize);
  return assets.filter((asset) => {
    if (options.kind && asset.kind !== options.kind) return false;
    if (options.source && asset.source !== options.source) return false;
    if (options.status && asset.status !== options.status) return false;
    if (tags.length && !tags.every((tag) => asset.tags.includes(tag))) return false;
    const haystack = normalize(`${asset.name} ${asset.kind} ${asset.tags.join(" ")} ${Object.values(asset.metadata ?? {}).join(" ")}`);
    return terms.every((term) => haystack.includes(term));
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function detectDuplicateAssets(assets: ManagedAsset[]): string[][] {
  const groups = new Map<string, string[]>();
  assets.forEach((asset) => { const key = asset.checksum || `${normalize(asset.name)}:${asset.size}`; groups.set(key, [...(groups.get(key) ?? []), asset.id]); });
  return [...groups.values()].filter((ids) => ids.length > 1);
}

export function relinkAsset(asset: ManagedAsset, uri: string, checksum?: string): ManagedAsset {
  return { ...asset, source: "linked", uri, checksum: checksum ?? checksumText(`${uri}|${asset.size}`), status: "available", updatedAt: Date.now() };
}

export function embedAsset(asset: ManagedAsset): ManagedAsset {
  return { ...asset, source: "embedded", status: "available", updatedAt: Date.now() };
}

export function auditAssetLibrary(library: AssetLibrary): AssetAuditReport {
  const issues: AssetIssue[] = [];
  const duplicates = detectDuplicateAssets(library.assets);
  library.assets.forEach((asset) => {
    if (asset.status === "missing" || (asset.source === "linked" && !asset.uri)) issues.push({ id: `missing-${asset.id}`, assetId: asset.id, severity: "error", message: `Missing linked asset: ${asset.name}`, fix: "Relink the source file or embed the asset." });
    if (!asset.license && asset.source === "stock") issues.push({ id: `license-${asset.id}`, assetId: asset.id, severity: "warning", message: `Stock asset has no license record: ${asset.name}`, fix: "Attach license and attribution metadata." });
    if (!asset.tags.length) issues.push({ id: `tags-${asset.id}`, assetId: asset.id, severity: "info", message: `Asset has no searchable tags: ${asset.name}`, fix: "Add descriptive tags." });
  });
  library.fonts.forEach((font) => { if (font.status !== "available") issues.push({ id: `font-${font.id}`, severity: "error", message: `Font unavailable: ${font.family} ${font.style}`, fix: "Activate, replace, or package the font." }); });
  duplicates.forEach((ids, index) => issues.push({ id: `duplicate-${index}`, severity: "warning", message: `${ids.length} duplicate assets detected.`, fix: "Consolidate duplicates while preserving links." }));
  const penalty = issues.reduce((sum, item) => sum + (item.severity === "error" ? 20 : item.severity === "warning" ? 8 : 2), 0);
  return { score: Math.max(0, 100 - penalty), totalAssets: library.assets.length, linkedAssets: library.assets.filter((a) => a.source === "linked").length, embeddedAssets: library.assets.filter((a) => a.source === "embedded").length, missingAssets: library.assets.filter((a) => a.status === "missing").length, duplicateGroups: duplicates, issues };
}

export const DEFAULT_ASSET_LIBRARY: AssetLibrary = {
  assets: [
    createManagedAsset({ id: "asset-brand-logo", name: "Yaposan Brand Logo", kind: "vector", source: "embedded", size: 18420, tags: ["brand", "logo", "identity"] }),
    createManagedAsset({ id: "asset-product-photo", name: "Product Hero Photo", kind: "image", source: "linked", uri: "assets/product-hero.jpg", size: 2480000, width: 2400, height: 3000, tags: ["product", "commerce", "hero"] }),
    createManagedAsset({ id: "asset-icon-set", name: "Publishing Icon Set", kind: "icon", source: "embedded", size: 96000, tags: ["icons", "ui", "publishing"] }),
  ],
  collections: [{ id: "collection-brand", name: "Brand Library", description: "Approved identity assets", assetIds: ["asset-brand-logo"], color: "#14B8A6" }],
  fonts: [
    { id: "font-inter", family: "Inter", style: "Regular", source: "embedded", status: "available", embedded: true },
    { id: "font-source-serif", family: "Source Serif 4", style: "Regular", source: "local", status: "available", embedded: false },
  ],
  updatedAt: Date.now(),
};
