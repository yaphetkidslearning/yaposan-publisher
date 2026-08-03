export type ImageCacheEntry = { key: string; uri: string; bytes: number; lastUsed: number; width?: number; height?: number };

export function imageFingerprint(input: { name?: string; size?: number; width?: number; height?: number; uri?: string }): string {
  return [input.name ?? "", input.size ?? 0, input.width ?? 0, input.height ?? 0, input.uri?.slice(-80) ?? ""].join("|");
}

export function findDuplicateImages<T extends Record<string, any>>(elements: T[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const element of elements) {
    if (element.type !== "image" || !element.imageUri) continue;
    const key = element.imageHash ?? element.originalImageUri ?? element.imageUri;
    groups.set(key, [...(groups.get(key) ?? []), element.id]);
  }
  return new Map([...groups].filter(([, ids]) => ids.length > 1));
}

export function pruneImageCache(entries: ImageCacheEntry[], maxBytes: number): ImageCacheEntry[] {
  const sorted = [...entries].sort((a, b) => b.lastUsed - a.lastUsed);
  let total = 0;
  return sorted.filter((entry) => { if (total + entry.bytes > maxBytes) return false; total += entry.bytes; return true; });
}

export function recommendedThumbnailSize(width: number, height: number, maxSide = 512) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
