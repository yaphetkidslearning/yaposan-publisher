import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AssetDefinition } from "../data/assetLibrary";

const LIBRARY_KEY = "yaposan.customAssetLibrary.v1";
const FAVORITES_KEY = "yaposan.assetFavorites.v2";
const RECENTS_KEY = "yaposan.recentAssets.v2";

async function loadStringArray(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

export async function loadCustomAssetLibrary(): Promise<AssetDefinition[]> {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AssetDefinition[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.svg) : [];
  } catch { return []; }
}
export async function saveCustomAssetLibrary(assets: AssetDefinition[]): Promise<void> { await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(assets)); }
export async function loadAssetFavorites(): Promise<string[]> { return loadStringArray(FAVORITES_KEY); }
export async function loadRecentAssets(): Promise<string[]> { return loadStringArray(RECENTS_KEY); }
export async function saveAssetFavorites(ids: string[]): Promise<void> { await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); }
export async function saveRecentAssets(ids: string[]): Promise<void> { await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(ids.slice(0, 32))); }

export function createCustomAsset(svg: string, name: string, kind: AssetDefinition["kind"] = "icon"): AssetDefinition {
  const category = kind === "brand" ? "Brand" : kind === "sticker" ? "Stickers" : kind === "decorative" ? "Decorative" : "Custom";
  return { id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name:name.replace(/\.svg$/i,"").trim()||"Custom Asset", category, kind, svg, tags:["custom",kind,name.toLowerCase()] };
}
