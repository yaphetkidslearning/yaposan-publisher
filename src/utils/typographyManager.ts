import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { PublisherProject } from "../types/publisher";
import { FONT_FAMILIES } from "../constants/publisher";
import { fontMetadataSupportsText, type FontFileMetadata, type FontUnicodeRange } from "./fontFileInspector";

export type FontCategory = "Sans Serif" | "Serif" | "Display" | "Monospace" | "Handwriting" | "Arabic" | "Ethiopic" | "Indic" | "CJK" | "Southeast Asian" | "Other Scripts" | "Custom" | "Local";
export type ScriptGroup = "Latin" | "Arabic" | "Hebrew" | "Ethiopic" | "Devanagari" | "Bengali" | "Gujarati" | "Gurmukhi" | "Tamil" | "Telugu" | "Kannada" | "Malayalam" | "Sinhala" | "Thai" | "Lao" | "Khmer" | "Myanmar" | "CJK" | "Cyrillic" | "Greek" | "Georgian" | "Armenian" | "Tibetan" | "Mongolian" | "Other";
export type FontSource = "catalog" | "project" | "local";
export type FontStyleName = "Thin" | "ExtraLight" | "Light" | "Regular" | "Medium" | "SemiBold" | "Bold" | "ExtraBold" | "Black" | "Italic" | "Bold Italic";
export type FontRecord = { family: string; category: FontCategory; fallback: string; builtIn: boolean; source?: FontSource; scripts?: ScriptGroup[]; styles?: FontStyleName[]; variable?: boolean; unicodeRanges?: FontUnicodeRange[]; embeddingPermission?: FontFileMetadata["embeddingPermission"]; postScriptName?: string; version?: string; axes?: FontFileMetadata["axes"] };

export const DEFAULT_FONT_STYLES: FontStyleName[] = ["Regular", "Bold", "Italic", "Bold Italic"];
export const VARIABLE_FONT_STYLES: FontStyleName[] = ["Thin", "ExtraLight", "Light", "Regular", "Medium", "SemiBold", "Bold", "ExtraBold", "Black", "Italic"];

const VARIABLE_FONT_FAMILIES = new Set(["Inter", "Roboto", "Open Sans", "Montserrat", "Noto Sans", "Noto Serif", "Source Sans Pro", "Source Serif Pro", "Ubuntu"]);
const FONT_SEARCH_ALIASES: Record<string, string[]> = {
  "Noto Sans Ethiopic": ["amharic", "tigrinya", "ethiopic", "geez"],
  "Noto Serif Ethiopic": ["amharic", "tigrinya", "ethiopic", "geez"],
  "Abyssinica SIL": ["amharic", "tigrinya", "ethiopic", "geez"],
  "Noto Sans Arabic": ["arabic", "farsi", "persian", "urdu", "pashto"],
  "Noto Naskh Arabic": ["arabic", "farsi", "persian", "urdu"],
  "Noto Sans Hebrew": ["hebrew", "yiddish"],
  "Noto Sans SC": ["chinese", "simplified chinese", "mandarin", "cjk"],
  "Noto Sans TC": ["chinese", "traditional chinese", "cjk"],
  "Noto Sans JP": ["japanese", "cjk"],
  "Noto Sans KR": ["korean", "hangul", "cjk"],
  "Noto Sans Devanagari": ["hindi", "marathi", "nepali", "devanagari"],
  "Noto Sans Bengali": ["bengali", "bangla"],
  "Noto Sans Gurmukhi": ["punjabi", "gurmukhi"],
  "Noto Sans Tamil": ["tamil"],
  "Noto Sans Telugu": ["telugu"],
  "Noto Sans Kannada": ["kannada"],
  "Noto Sans Malayalam": ["malayalam"],
  "Noto Sans Thai": ["thai"],
  "Noto Sans Khmer": ["khmer", "cambodian"],
  "Noto Sans Myanmar": ["burmese", "myanmar"],
};

const MULTILINGUAL_CATEGORIES: Record<string, FontCategory> = {
  "Noto Sans Arabic":"Arabic", "Noto Kufi Arabic":"Arabic", "Noto Naskh Arabic":"Arabic", "Noto Sans Hebrew":"Arabic",
  "Noto Sans Ethiopic":"Ethiopic", "Noto Serif Ethiopic":"Ethiopic", "Abyssinica SIL":"Ethiopic", "Nyala":"Ethiopic",
  "Noto Sans Devanagari":"Indic", "Noto Serif Devanagari":"Indic", "Noto Sans Bengali":"Indic", "Noto Serif Bengali":"Indic",
  "Noto Sans Gujarati":"Indic", "Noto Serif Gujarati":"Indic", "Noto Sans Gurmukhi":"Indic", "Noto Serif Gurmukhi":"Indic",
  "Noto Sans Tamil":"Indic", "Noto Serif Tamil":"Indic", "Noto Sans Telugu":"Indic", "Noto Serif Telugu":"Indic",
  "Noto Sans Kannada":"Indic", "Noto Serif Kannada":"Indic", "Noto Sans Malayalam":"Indic", "Noto Serif Malayalam":"Indic",
  "Noto Sans Sinhala":"Indic", "Noto Serif Sinhala":"Indic",
  "Noto Sans SC":"CJK", "Noto Serif SC":"CJK", "Noto Sans TC":"CJK", "Noto Serif TC":"CJK", "Noto Sans HK":"CJK", "Noto Serif HK":"CJK",
  "Noto Sans JP":"CJK", "Noto Serif JP":"CJK", "Noto Sans KR":"CJK", "Noto Serif KR":"CJK", "Microsoft YaHei":"CJK", "Microsoft JhengHei":"CJK",
  "SimSun":"CJK", "SimHei":"CJK", "KaiTi":"CJK", "FangSong":"CJK", "Meiryo":"CJK", "MS Gothic":"CJK", "MS Mincho":"CJK", "Malgun Gothic":"CJK", "Batang":"CJK", "Gulim":"CJK", "Yu Gothic":"CJK",
  "Noto Sans Thai":"Southeast Asian", "Noto Serif Thai":"Southeast Asian", "Noto Sans Lao":"Southeast Asian", "Noto Serif Lao":"Southeast Asian",
  "Noto Sans Khmer":"Southeast Asian", "Noto Serif Khmer":"Southeast Asian", "Noto Sans Myanmar":"Southeast Asian", "Noto Serif Myanmar":"Southeast Asian",
  "Leelawadee":"Southeast Asian", "Leelawadee UI":"Southeast Asian", "Angsana New":"Southeast Asian", "Cordia New":"Southeast Asian",
  "Noto Sans Georgian":"Other Scripts", "Noto Serif Georgian":"Other Scripts", "Noto Sans Armenian":"Other Scripts", "Noto Serif Armenian":"Other Scripts",
  "Noto Sans Greek":"Other Scripts", "Noto Serif Greek":"Other Scripts", "Noto Sans Cyrillic":"Other Scripts", "Noto Serif Cyrillic":"Other Scripts",
  "Noto Sans Vietnamese":"Other Scripts", "Noto Serif Vietnamese":"Other Scripts", "Noto Sans Tibetan":"Other Scripts", "Noto Serif Tibetan":"Other Scripts",
  "Noto Sans Mongolian":"Other Scripts", "Noto Sans Cherokee":"Other Scripts", "Noto Sans Canadian Aboriginal":"Other Scripts", "Noto Sans Symbols":"Other Scripts", "Noto Sans Symbols 2":"Other Scripts",
};

const SERIF_FONTS = new Set(["Baskerville","Bodoni 72","Book Antiqua","Bookman Old Style","Cambria","Cambria Math","Century","Charter","Constantia","Didot","Garamond","Georgia","Hoefler Text","Libre Baskerville","Merriweather","Palatino","Palatino Linotype","Perpetua","Playfair Display","Rockwell","Times","Times New Roman","Bell MT","Bookman","Californian FB","Centaur","Century Schoolbook","Goudy Old Style","High Tower Text","Lucida Bright","Sitka Text","Sylfaen"]);
const MONOSPACE_FONTS = new Set(["Courier","Courier New","Cascadia Code","Cascadia Mono","Consolas","DejaVu Sans Mono","Fira Code","IBM Plex Mono","JetBrains Mono","Lucida Console","Menlo","Monaco","Roboto Mono","Source Code Pro","Ubuntu Mono"]);
const HANDWRITING_FONTS = new Set(["Bradley Hand","Brush Script MT","Comic Sans MS","Dancing Script","Freestyle Script","Ink Free","Kunstler Script","Lucida Calligraphy","Lucida Handwriting","Mistral","Pacifico","Rage Italic","Segoe Print","Segoe Script","Snell Roundhand","Viner Hand ITC","Vivaldi"]);
const DISPLAY_FONTS = new Set(["Agency FB","Algerian","Anton","Bebas Neue","Berlin Sans FB","Blackadder ITC","Bodoni MT Poster","Broadway","Castellar","Copperplate","Cooper Black","Elephant","Engravers MT","Forte","Haettenschweiler","Harlow Solid Italic","Harrington","Impact","Jokerman","Kristen ITC","Magneto","Niagara Engraved","Niagara Solid","Old English Text MT","Onyx","Oswald","Papyrus","Ravie","Showcard Gothic","Stencil","Wide Latin","Bernard MT Condensed","Britannic Bold","Eras ITC","Felix Titling","Footlight MT Light"]);

function builtInCategory(family: string): FontCategory {
  if (MULTILINGUAL_CATEGORIES[family]) return MULTILINGUAL_CATEGORIES[family];
  if (SERIF_FONTS.has(family)) return "Serif";
  if (MONOSPACE_FONTS.has(family)) return "Monospace";
  if (HANDWRITING_FONTS.has(family)) return "Handwriting";
  if (DISPLAY_FONTS.has(family)) return "Display";
  return "Sans Serif";
}

export function detectScripts(text: string): ScriptGroup[] {
  const found = new Set<ScriptGroup>();
  for (const ch of text || "") {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f) || (cp >= 0x08a0 && cp <= 0x08ff)) found.add("Arabic");
    else if (cp >= 0x0590 && cp <= 0x05ff) found.add("Hebrew");
    else if (cp >= 0x1200 && cp <= 0x137f) found.add("Ethiopic");
    else if (cp >= 0x0900 && cp <= 0x097f) found.add("Devanagari");
    else if (cp >= 0x0980 && cp <= 0x09ff) found.add("Bengali");
    else if (cp >= 0x0a80 && cp <= 0x0aff) found.add("Gujarati");
    else if (cp >= 0x0a00 && cp <= 0x0a7f) found.add("Gurmukhi");
    else if (cp >= 0x0b80 && cp <= 0x0bff) found.add("Tamil");
    else if (cp >= 0x0c00 && cp <= 0x0c7f) found.add("Telugu");
    else if (cp >= 0x0c80 && cp <= 0x0cff) found.add("Kannada");
    else if (cp >= 0x0d00 && cp <= 0x0d7f) found.add("Malayalam");
    else if (cp >= 0x0d80 && cp <= 0x0dff) found.add("Sinhala");
    else if (cp >= 0x0e00 && cp <= 0x0e7f) found.add("Thai");
    else if (cp >= 0x0e80 && cp <= 0x0eff) found.add("Lao");
    else if (cp >= 0x1780 && cp <= 0x17ff) found.add("Khmer");
    else if (cp >= 0x1000 && cp <= 0x109f) found.add("Myanmar");
    else if ((cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0xac00 && cp <= 0xd7af)) found.add("CJK");
    else if (cp >= 0x0400 && cp <= 0x052f) found.add("Cyrillic");
    else if (cp >= 0x0370 && cp <= 0x03ff) found.add("Greek");
    else if (cp >= 0x10a0 && cp <= 0x10ff) found.add("Georgian");
    else if (cp >= 0x0530 && cp <= 0x058f) found.add("Armenian");
    else if (cp >= 0x0f00 && cp <= 0x0fff) found.add("Tibetan");
    else if (cp >= 0x1800 && cp <= 0x18af) found.add("Mongolian");
    else if ((cp >= 0x0041 && cp <= 0x024f) || (cp >= 0x1e00 && cp <= 0x1eff)) found.add("Latin");
  }
  return found.size ? [...found] : ["Latin"];
}

function scriptsForFamily(family: string, category: FontCategory): ScriptGroup[] {
  const lower = family.toLowerCase();
  if (lower.includes("hebrew")) return ["Hebrew"];
  if (category === "Arabic") return lower.includes("hebrew") ? ["Hebrew"] : ["Arabic"];
  if (category === "Ethiopic") return ["Ethiopic"];
  if (category === "CJK") return ["CJK"];
  if (category === "Southeast Asian") {
    if (lower.includes("thai") || lower.includes("leelawadee") || lower.includes("angsana") || lower.includes("cordia")) return ["Thai"];
    if (lower.includes("lao")) return ["Lao"];
    if (lower.includes("khmer")) return ["Khmer"];
    if (lower.includes("myanmar")) return ["Myanmar"];
  }
  if (category === "Indic") {
    const pairs: Array<[string, ScriptGroup]> = [["devanagari","Devanagari"],["bengali","Bengali"],["gujarati","Gujarati"],["gurmukhi","Gurmukhi"],["tamil","Tamil"],["telugu","Telugu"],["kannada","Kannada"],["malayalam","Malayalam"],["sinhala","Sinhala"]];
    return pairs.find(([needle]) => lower.includes(needle))?.slice(1) as ScriptGroup[] || ["Devanagari"];
  }
  if (category === "Other Scripts") {
    const pairs: Array<[string, ScriptGroup]> = [["cyrillic","Cyrillic"],["greek","Greek"],["georgian","Georgian"],["armenian","Armenian"],["tibetan","Tibetan"],["mongolian","Mongolian"]];
    return pairs.find(([needle]) => lower.includes(needle))?.slice(1) as ScriptGroup[] || ["Other"];
  }
  return ["Latin"];
}

function builtInFallback(family: string, category: FontCategory) {
  if (category === "Serif") return family === "Times New Roman" ? "Times, serif" : "Georgia, 'Times New Roman', serif";
  if (category === "Monospace") return "Consolas, 'Courier New', monospace";
  if (category === "Handwriting") return "cursive";
  if (category === "Arabic") return "'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif";
  if (category === "Ethiopic") return "'Noto Sans Ethiopic', 'Abyssinica SIL', Nyala, sans-serif";
  if (category === "Indic") return "'Noto Sans Devanagari', 'Noto Sans', Arial, sans-serif";
  if (category === "CJK") return "'Noto Sans CJK SC', 'Microsoft YaHei', 'Yu Gothic', 'Malgun Gothic', sans-serif";
  if (category === "Southeast Asian") return "'Noto Sans Thai', 'Leelawadee UI', 'Noto Sans', sans-serif";
  if (category === "Other Scripts") return "'Noto Sans', 'Segoe UI', Arial, sans-serif";
  if (category === "Display") return "'Arial Black', Impact, sans-serif";
  return family === "Arial" ? "Helvetica, sans-serif" : "Arial, Helvetica, sans-serif";
}

export const TYPOGRAPHY_FONTS: FontRecord[] = FONT_FAMILIES.map((family) => {
  const category = builtInCategory(family);
  return { family, category, fallback: builtInFallback(family, category), builtIn: true, source: "catalog", scripts: scriptsForFamily(family, category), styles: VARIABLE_FONT_FAMILIES.has(family) ? VARIABLE_FONT_STYLES : DEFAULT_FONT_STYLES, variable: VARIABLE_FONT_FAMILIES.has(family) };
});

const FAVORITES_KEY = "yaposan.typography.favorites.v1";
const RECENTS_KEY = "yaposan.typography.recents.v1";
const LOCAL_FONTS_KEY = "yaposan.typography.local-fonts.v1";

export function normalizeFontFamily(value?: string) { return value?.trim() || "Arial"; }
export function fontFallback(family: string) { return TYPOGRAPHY_FONTS.find((font) => font.family === family)?.fallback ?? "Arial, Helvetica, sans-serif"; }

export function scriptFallbackFamilies(text: string): string[] {
  const scripts = detectScripts(text);
  const families: string[] = [];
  const add = (...items: string[]) => items.forEach((item) => { if (!families.includes(item)) families.push(item); });
  scripts.forEach((script) => {
    if (script === "Arabic") add("Noto Sans Arabic", "Noto Naskh Arabic", "Segoe UI");
    else if (script === "Hebrew") add("Noto Sans Hebrew", "Arial");
    else if (script === "Ethiopic") add("Noto Sans Ethiopic", "Abyssinica SIL", "Nyala");
    else if (["Devanagari","Bengali","Gujarati","Gurmukhi","Tamil","Telugu","Kannada","Malayalam","Sinhala"].includes(script)) add(`Noto Sans ${script}`, "Noto Sans");
    else if (script === "CJK") add("Noto Sans SC", "Microsoft YaHei", "Yu Gothic", "Malgun Gothic");
    else if (script === "Thai") add("Noto Sans Thai", "Leelawadee UI");
    else if (script === "Lao") add("Noto Sans Lao", "Noto Sans");
    else if (script === "Khmer") add("Noto Sans Khmer", "Noto Sans");
    else if (script === "Myanmar") add("Noto Sans Myanmar", "Noto Sans");
    else if (script === "Cyrillic") add("Noto Sans Cyrillic", "Noto Sans");
    else if (script === "Greek") add("Noto Sans Greek", "Noto Sans");
  });
  add("Noto Sans", "Arial", "sans-serif");
  return families;
}

export function fontCssStack(family: string, text = "") {
  const quote = (name: string) => name === "sans-serif" || name === "serif" || name === "monospace" || name === "cursive" ? name : `'${name.replace(/'/g, "\\'")}'`;
  return [family, ...scriptFallbackFamilies(text), ...fontFallback(family).split(",").map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))]
    .filter((value, index, list) => value && list.indexOf(value) === index)
    .map(quote).join(", ");
}

export function detectTextDirection(text: string): "ltr" | "rtl" {
  for (const ch of text || "") {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x0590 && cp <= 0x08ff) || (cp >= 0xfb1d && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfefc)) return "rtl";
    if ((cp >= 0x0041 && cp <= 0x005a) || (cp >= 0x0061 && cp <= 0x007a) || cp >= 0x0900) return "ltr";
  }
  return "ltr";
}

export function fontSupportsText(font: FontRecord, text: string) {
  if (!text.trim()) return true;
  const exact = fontMetadataSupportsText(font.unicodeRanges ? { unicodeRanges: font.unicodeRanges } : undefined, text);
  if (exact !== undefined) return exact;
  const browser = browserFontSupportsText(font.family, text);
  if (browser !== undefined && (font.source === "local" || font.source === "project")) return browser;
  const scripts = detectScripts(text);
  if (scripts.every((script) => script === "Latin")) return true;
  if (!font.scripts?.length || font.scripts.includes("Other")) return false;
  return scripts.every((script) => script === "Latin" || font.scripts?.includes(script));
}

export function fontPreviewText(font: FontRecord, selectedText = "") {
  const scripts = detectScripts(selectedText);
  if (selectedText.trim() && scripts.some((script) => script !== "Latin")) return selectedText.slice(0, 64);
  const script = font.scripts?.[0] ?? "Latin";
  const samples: Partial<Record<ScriptGroup, string>> = {
    Arabic:"مرحبا بالعالم 123", Hebrew:"שלום עולם 123", Ethiopic:"ሰላም ዓለም 123", Devanagari:"नमस्ते दुनिया 123", Bengali:"নমস্কার বিশ্ব 123", Gujarati:"નમસ્તે વિશ્વ 123", Gurmukhi:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ 123", Tamil:"வணக்கம் உலகம் 123", Telugu:"నమస్కారం ప్రపంచం 123", Kannada:"ನಮಸ್ಕಾರ ವಿಶ್ವ 123", Malayalam:"നമസ്കാരം ലോകം 123", Sinhala:"ආයුබෝවන් ලෝකය 123", Thai:"สวัสดีชาวโลก 123", Lao:"ສະບາຍດີໂລກ 123", Khmer:"សួស្តី​ពិភពលោក 123", Myanmar:"မင်္ဂလာပါ ကမ္ဘာ 123", CJK:"你好世界 日本語 한국어 123", Cyrillic:"Привет мир 123", Greek:"Γεια σου κόσμε 123", Georgian:"გამარჯობა მსოფლიო 123", Armenian:"Բարեւ աշխարհ 123", Tibetan:"བཀྲ་ཤིས་ 123", Mongolian:"ᠰᠠᠢᠨ 123",
  };
  return samples[script] ?? "Aa Bb Cc 123 — The quick brown fox";
}

function stylesFromMetadata(metadata?: FontFileMetadata): FontStyleName[] {
  if (!metadata) return DEFAULT_FONT_STYLES;
  const style = (metadata.subfamily ?? "Regular").toLowerCase();
  const names = new Set<FontStyleName>();
  if (style.includes("italic") || style.includes("oblique")) names.add(style.includes("bold") ? "Bold Italic" : "Italic");
  else if ((metadata.weightClass ?? 400) >= 850) names.add("Black");
  else if ((metadata.weightClass ?? 400) >= 750) names.add("ExtraBold");
  else if ((metadata.weightClass ?? 400) >= 650) names.add("Bold");
  else if ((metadata.weightClass ?? 400) >= 550) names.add("SemiBold");
  else if ((metadata.weightClass ?? 400) >= 450) names.add("Medium");
  else if ((metadata.weightClass ?? 400) <= 150) names.add("Thin");
  else if ((metadata.weightClass ?? 400) <= 250) names.add("ExtraLight");
  else if ((metadata.weightClass ?? 400) <= 350) names.add("Light");
  else names.add("Regular");
  return [...names];
}
function scriptsFromUnicodeRanges(ranges: FontUnicodeRange[] = []): ScriptGroup[] {
  const probes: Array<[ScriptGroup, number]> = [["Latin",0x0041],["Arabic",0x0627],["Hebrew",0x05d0],["Ethiopic",0x1200],["Devanagari",0x0915],["Bengali",0x0995],["Gujarati",0x0a95],["Gurmukhi",0x0a15],["Tamil",0x0b95],["Telugu",0x0c15],["Kannada",0x0c95],["Malayalam",0x0d15],["Sinhala",0x0d9a],["Thai",0x0e01],["Lao",0x0e81],["Khmer",0x1780],["Myanmar",0x1000],["CJK",0x4e00],["Cyrillic",0x0410],["Greek",0x0391],["Georgian",0x10d0],["Armenian",0x0531],["Tibetan",0x0f40],["Mongolian",0x1820]];
  const found = probes.filter(([, cp]) => ranges.some(([start,end]) => cp >= start && cp <= end)).map(([script]) => script);
  return found.length ? found : ["Other"];
}
export function customFonts(project: PublisherProject): FontRecord[] {
  return Object.keys(project.embeddedFonts ?? {}).sort().map((family) => {
    const metadata = project.embeddedFontMetadata?.[family];
    return { family, category: "Custom" as const, fallback: "Arial, sans-serif", builtIn: false, source: "project" as const, scripts: scriptsFromUnicodeRanges(metadata?.unicodeRanges), styles: stylesFromMetadata(metadata), variable: metadata?.variable ?? false, unicodeRanges: metadata?.unicodeRanges, embeddingPermission: metadata?.embeddingPermission, postScriptName: metadata?.postScriptName, version: metadata?.version, axes: metadata?.axes };
  });
}
export function localFontRecords(localFonts: string[] = []): FontRecord[] {
  return [...new Set(localFonts.map((family) => family.trim()).filter(Boolean))].sort().map((family) => ({ family, category: "Local" as const, fallback: "Arial, sans-serif", builtIn: false, source: "local" as const, scripts: ["Other" as const], styles: DEFAULT_FONT_STYLES }));
}
export function allProjectFonts(project: PublisherProject, localFonts: string[] = []) {
  // Runtime sources must win over catalog placeholders with the same family name.
  // Otherwise importing e.g. Montserrat would still display the catalog record and
  // hide its verified cmap/embedding metadata.
  const byFamily = new Map<string, FontRecord>();
  for (const font of TYPOGRAPHY_FONTS) byFamily.set(font.family.toLowerCase(), font);
  for (const font of localFontRecords(localFonts)) byFamily.set(font.family.toLowerCase(), font);
  for (const font of customFonts(project)) byFamily.set(font.family.toLowerCase(), font);
  return [...byFamily.values()].sort((a, b) => a.family.localeCompare(b.family));
}
export function fontSearchTerms(font: FontRecord) {
  return [font.family, font.category, ...(font.scripts ?? []), ...(FONT_SEARCH_ALIASES[font.family] ?? []), ...(font.styles ?? [])].join(" ").toLowerCase();
}
export function searchFonts(project: PublisherProject, query = "", category: FontCategory | "All" = "All", localFonts: string[] = []) {
  const needle = query.trim().toLowerCase();
  return allProjectFonts(project, localFonts).filter((font) => (category === "All" || font.category === category) && (!needle || fontSearchTerms(font).includes(needle)));
}
export function documentFontFamilies(project: PublisherProject) {
  return [...fontUsage(project).keys()].sort((a, b) => a.localeCompare(b));
}
export function missingDocumentFonts(project: PublisherProject, localFonts: string[] = []) {
  return documentFontFamilies(project).filter((family) => !isFontRuntimeAvailable(project, family, localFonts));
}
export function missingFontRecords(project: PublisherProject, localFonts: string[] = []): FontRecord[] {
  const known = allProjectFonts(project, localFonts);
  return missingDocumentFonts(project, localFonts).map((family) => known.find((font) => font.family === family) ?? ({ family, category: builtInCategory(family), fallback: "Arial, sans-serif", builtIn: false, source: "catalog", scripts: ["Other"], styles: ["Regular"] } as FontRecord));
}
export function fontSourceLabel(font: FontRecord) {
  if (font.source === "project") return "Embedded";
  if (font.source === "local") return "Installed";
  return "Catalog";
}
export function fontReplacementCandidates(project: PublisherProject, family: string, localFonts: string[] = [], text = "") {
  const desired = allProjectFonts(project, localFonts).find((font) => font.family === family);
  const scripts = detectScripts(text);
  return allProjectFonts(project, localFonts)
    .filter((font) => font.family !== family && isFontRuntimeAvailable(project, font.family, localFonts))
    .filter((font) => !text.trim() || fontSupportsText(font, text))
    .map((font) => {
      let score = 0;
      if (desired && font.category === desired.category) score += 30;
      if (scripts.every((script) => script === "Latin" || font.scripts?.includes(script))) score += 50;
      if (font.source === "project") score += 10;
      if (font.family.startsWith("Noto ")) score += 5;
      return { font, score };
    })
    .sort((a, b) => b.score - a.score || a.font.family.localeCompare(b.font.family))
    .slice(0, 8)
    .map(({ font }) => font);
}
export function browserFontSupportsText(family: string, text: string) {
  if (Platform.OS !== "web" || typeof document === "undefined" || !document.fonts) return undefined;
  if (!text.trim()) return document.fonts.check(`12px "${family}"`);
  return document.fonts.check(`12px "${family}"`, text);
}
export function fontUsage(project: PublisherProject) {
  const usage = new Map<string, number>();
  project.pages.forEach((page) => page.elements.forEach((element) => { if (element.type === "text") usage.set(normalizeFontFamily(element.fontFamily), (usage.get(normalizeFontFamily(element.fontFamily)) ?? 0) + 1); }));
  return usage;
}
export function isFontKnown(project: PublisherProject, family: string, localFonts: string[] = []) { return allProjectFonts(project, localFonts).some((font) => font.family === family); }
export function addEmbeddedFont(project: PublisherProject, family: string, dataUri: string, metadata?: FontFileMetadata): PublisherProject {
  const clean = family.trim(); if (!clean || !dataUri) throw new Error("Font name and font data are required.");
  return { ...project, updatedAt: Date.now(), embeddedFonts: { ...(project.embeddedFonts ?? {}), [clean]: dataUri }, embeddedFontMetadata: metadata ? { ...(project.embeddedFontMetadata ?? {}), [clean]: metadata } : project.embeddedFontMetadata };
}
export function removeEmbeddedFont(project: PublisherProject, family: string): PublisherProject {
  const next = { ...(project.embeddedFonts ?? {}) }; delete next[family];
  const nextMetadata = { ...(project.embeddedFontMetadata ?? {}) }; delete nextMetadata[family];
  return { ...project, updatedAt: Date.now(), embeddedFonts: next, embeddedFontMetadata: nextMetadata };
}
async function loadList(key: string) { try { const value = JSON.parse((await AsyncStorage.getItem(key)) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
async function saveList(key: string, values: string[]) { await AsyncStorage.setItem(key, JSON.stringify([...new Set(values)])); }
export const loadFontFavorites = () => loadList(FAVORITES_KEY);
export const saveFontFavorites = (values: string[]) => saveList(FAVORITES_KEY, values);
export const loadRecentFonts = () => loadList(RECENTS_KEY);
export async function rememberRecentFont(family: string) { const current = await loadRecentFonts(); const next = [family, ...current.filter((item) => item !== family)].slice(0, 8); await saveList(RECENTS_KEY, next); return next; }
export const loadDiscoveredLocalFonts = () => loadList(LOCAL_FONTS_KEY);
export const saveDiscoveredLocalFonts = (values: string[]) => saveList(LOCAL_FONTS_KEY, values);

export async function discoverLocalFonts(): Promise<string[]> {
  if (Platform.OS !== "web" || typeof window === "undefined") return [];
  const queryLocalFonts = (window as Window & { queryLocalFonts?: () => Promise<Array<{ family?: string }>> }).queryLocalFonts;
  if (typeof queryLocalFonts !== "function") return [];
  const entries = await queryLocalFonts();
  return [...new Set(entries.map((entry) => String(entry.family ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const NATIVE_SAFE_FONTS = new Set(["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "System"]);
export function isFontRuntimeAvailable(project: PublisherProject, family: string, localFonts: string[] = []) {
  if (project.embeddedFonts?.[family]) return true;
  if (localFonts.includes(family)) return true;
  if (Platform.OS === "web" && typeof document !== "undefined" && document.fonts) return document.fonts.check(`12px "${family}"`);
  return NATIVE_SAFE_FONTS.has(family);
}
export function fontRuntimeStatus(project: PublisherProject, family: string, localFonts: string[] = []) {
  if (project.embeddedFonts?.[family]) return "Embedded" as const;
  if (localFonts.includes(family)) return "Installed" as const;
  if (isFontRuntimeAvailable(project, family, localFonts)) return "Available" as const;
  if (TYPOGRAPHY_FONTS.some((font) => font.family === family)) return "Catalog only" as const;
  return "Missing" as const;
}
