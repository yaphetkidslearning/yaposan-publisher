import type { ImageAssetRecord } from "./advancedImageEngine";

const STORAGE_KEY = "yaposan.publisher.image-assets.v1";

export function loadImageAssets(): ImageAssetRecord[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ImageAssetRecord[]; } catch { return []; }
}

export function saveImageAssets(items: ImageAssetRecord[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-200)));
}

export function addImageAsset(asset: Omit<ImageAssetRecord, "id" | "createdAt">): ImageAssetRecord[] {
  const items = loadImageAssets();
  const next: ImageAssetRecord = { ...asset, id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: Date.now() };
  const updated = [...items.filter((item) => item.uri !== asset.uri), next];
  saveImageAssets(updated);
  return updated;
}

export function toggleFavoriteAsset(id: string) {
  const updated = loadImageAssets().map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item);
  saveImageAssets(updated);
  return updated;
}
