import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PublisherProject } from "../types/publisher";

export type FontCategory = "Sans Serif" | "Serif" | "Display" | "Monospace" | "Handwriting" | "Custom";
export type FontRecord = { family: string; category: FontCategory; fallback: string; builtIn: boolean };

export const TYPOGRAPHY_FONTS: FontRecord[] = [
  { family: "Arial", category: "Sans Serif", fallback: "Helvetica, sans-serif", builtIn: true },
  { family: "Helvetica", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Verdana", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Tahoma", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Trebuchet MS", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Roboto", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Inter", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Lato", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Montserrat", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Poppins", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Open Sans", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Nunito", category: "Sans Serif", fallback: "Arial, sans-serif", builtIn: true },
  { family: "Times New Roman", category: "Serif", fallback: "Times, serif", builtIn: true },
  { family: "Georgia", category: "Serif", fallback: "Times New Roman, serif", builtIn: true },
  { family: "Playfair Display", category: "Serif", fallback: "Georgia, serif", builtIn: true },
  { family: "Merriweather", category: "Serif", fallback: "Georgia, serif", builtIn: true },
  { family: "Impact", category: "Display", fallback: "Arial Black, sans-serif", builtIn: true },
  { family: "Oswald", category: "Display", fallback: "Arial Narrow, sans-serif", builtIn: true },
  { family: "Anton", category: "Display", fallback: "Impact, sans-serif", builtIn: true },
  { family: "Courier New", category: "Monospace", fallback: "Courier, monospace", builtIn: true },
  { family: "Pacifico", category: "Handwriting", fallback: "cursive", builtIn: true },
  { family: "Comic Sans MS", category: "Handwriting", fallback: "cursive", builtIn: true },
];

const FAVORITES_KEY = "yaposan.typography.favorites.v1";
const RECENTS_KEY = "yaposan.typography.recents.v1";

export function normalizeFontFamily(value?: string) { return value?.trim() || "Arial"; }
export function fontFallback(family: string) { return TYPOGRAPHY_FONTS.find((font) => font.family === family)?.fallback ?? "Arial, sans-serif"; }
export function customFonts(project: PublisherProject): FontRecord[] {
  return Object.keys(project.embeddedFonts ?? {}).sort().map((family) => ({ family, category: "Custom", fallback: "Arial, sans-serif", builtIn: false }));
}
export function allProjectFonts(project: PublisherProject) { return [...TYPOGRAPHY_FONTS, ...customFonts(project)]; }
export function searchFonts(project: PublisherProject, query = "", category: FontCategory | "All" = "All") {
  const needle = query.trim().toLowerCase();
  return allProjectFonts(project).filter((font) => (category === "All" || font.category === category) && (!needle || font.family.toLowerCase().includes(needle)));
}
export function fontUsage(project: PublisherProject) {
  const usage = new Map<string, number>();
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.type === "text") usage.set(normalizeFontFamily(element.fontFamily), (usage.get(normalizeFontFamily(element.fontFamily)) ?? 0) + 1);
  }));
  return usage;
}
export function isFontKnown(project: PublisherProject, family: string) { return allProjectFonts(project).some((font) => font.family === family); }
export function addEmbeddedFont(project: PublisherProject, family: string, dataUri: string): PublisherProject {
  const clean = family.trim();
  if (!clean || !dataUri) throw new Error("Font name and font data are required.");
  return { ...project, updatedAt: Date.now(), embeddedFonts: { ...(project.embeddedFonts ?? {}), [clean]: dataUri } };
}
export function removeEmbeddedFont(project: PublisherProject, family: string): PublisherProject {
  const next = { ...(project.embeddedFonts ?? {}) }; delete next[family];
  return { ...project, updatedAt: Date.now(), embeddedFonts: next };
}
async function loadList(key: string) { try { const value = JSON.parse((await AsyncStorage.getItem(key)) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
async function saveList(key: string, values: string[]) { await AsyncStorage.setItem(key, JSON.stringify([...new Set(values)])); }
export const loadFontFavorites = () => loadList(FAVORITES_KEY);
export const saveFontFavorites = (values: string[]) => saveList(FAVORITES_KEY, values);
export const loadRecentFonts = () => loadList(RECENTS_KEY);
export async function rememberRecentFont(family: string) { const current = await loadRecentFonts(); const next = [family, ...current.filter((item) => item !== family)].slice(0, 8); await saveList(RECENTS_KEY, next); return next; }
