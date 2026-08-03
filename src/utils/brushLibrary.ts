import AsyncStorage from "@react-native-async-storage/async-storage";
import { PAINT_PRESETS, normalizePaintingSettings, type PaintPreset, type PaintingSettings } from "./paintingEngine";

export type BrushCategory = "Inking" | "Painting" | "Wet Media" | "Dry Media" | "Airbrush" | "Lettering" | "Markers" | "Special";
export type BrushLibraryItem = PaintPreset & {
  category: BrushCategory;
  favorite?: boolean;
  recentAt?: number;
  custom?: boolean;
  description?: string;
  tags?: string[];
};

const STORAGE_KEY = "yaposan.phase18.1.brush-library";

const categoryFor = (preset: PaintPreset): BrushCategory => {
  if (preset.tip === "watercolor" || preset.tip === "oil") return "Wet Media";
  if (preset.tip === "charcoal" || preset.tip === "chalk") return "Dry Media";
  if (preset.tip === "spray") return "Airbrush";
  if (preset.tip === "calligraphy") return "Lettering";
  if (preset.tool === "marker" || preset.tool === "highlighter") return "Markers";
  if (preset.name.toLowerCase().includes("ink")) return "Inking";
  return "Painting";
};

export const BUILT_IN_BRUSH_LIBRARY: BrushLibraryItem[] = PAINT_PRESETS.map((preset) => ({
  ...preset,
  category: categoryFor(preset),
  description: `${preset.name} professional brush preset`,
  tags: [preset.tip, preset.tool, preset.texture],
}));

export async function loadBrushLibrary(): Promise<BrushLibraryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_BRUSH_LIBRARY;
    const saved = JSON.parse(raw) as BrushLibraryItem[];
    const custom = saved.filter((item) => item.custom);
    const state = new Map(saved.map((item) => [item.presetId, item]));
    return [...BUILT_IN_BRUSH_LIBRARY.map((item) => ({ ...item, favorite: state.get(item.presetId)?.favorite, recentAt: state.get(item.presetId)?.recentAt })), ...custom];
  } catch {
    return BUILT_IN_BRUSH_LIBRARY;
  }
}

export async function saveBrushLibrary(items: BrushLibraryItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createCustomBrush(name: string, settings: PaintingSettings, category: BrushCategory = "Special"): BrushLibraryItem {
  const normalized = normalizePaintingSettings(settings);
  return {
    ...normalized,
    name: name.trim() || "Custom Brush",
    tool: normalized.tip === "calligraphy" ? "calligraphy" : normalized.tip === "spray" ? "airbrush" : "brush",
    presetId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    custom: true,
    description: "Custom Phase 18.1 brush preset",
    tags: [normalized.tip, normalized.texture, "custom"],
  };
}

export function duplicateBrush(item: BrushLibraryItem): BrushLibraryItem {
  return { ...item, presetId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: `${item.name} Copy`, custom: true, favorite: false };
}

export function exportBrushPack(items: BrushLibraryItem[]): string {
  return JSON.stringify({ format: "yaposan-brush-pack", version: "18.1", exportedAt: new Date().toISOString(), brushes: items }, null, 2);
}

export function importBrushPack(raw: string): BrushLibraryItem[] {
  const parsed = JSON.parse(raw) as { format?: string; brushes?: BrushLibraryItem[] };
  if (parsed.format !== "yaposan-brush-pack" || !Array.isArray(parsed.brushes)) throw new Error("Invalid Yaposan brush pack");
  return parsed.brushes.map((item, index) => ({ ...item, presetId: `custom-import-${Date.now()}-${index}`, custom: true, category: item.category ?? "Special" }));
}
