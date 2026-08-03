import type { PublisherElement } from "../types/publisher";

type E = PublisherElement & Record<string, any>;
export type OpenTypeFeature2 = "liga" | "dlig" | "calt" | "kern" | "frac" | "ordn" | "smcp" | "c2sc" | "onum" | "lnum" | "pnum" | "tnum" | "ss01" | "ss02" | "ss03" | "swsh";
export type VariableFontAxis2 = { tag: "wght" | "wdth" | "opsz" | "slnt" | "ital" | string; min: number; max: number; value: number; defaultValue?: number };
export type FontFallback2 = { family: string; scripts?: string[]; languageTags?: string[]; emoji?: boolean };
export type TextPath2 = { pathId: string; startOffset: number; side: "left" | "right"; align: "start" | "center" | "end" | "justify"; reverse: boolean; baselineOffset: number; keepUpright: boolean };
export type ParagraphComposer2 = { mode: "single-line" | "multi-line" | "balanced"; hyphenation: boolean; language: string; minWordLength: number; minBefore: number; minAfter: number; consecutiveHyphenLimit: number; justification: { minWordSpacing: number; desiredWordSpacing: number; maxWordSpacing: number; minLetterSpacing: number; desiredLetterSpacing: number; maxLetterSpacing: number; glyphScalingMin: number; glyphScalingMax: number }; widowLines: number; orphanLines: number; keepTogether: boolean };
export type TextThread2 = { threadId: string; frameIds: string[]; overflowBehavior: "overset" | "auto-create-frame" | "truncate"; balanceColumns: boolean };
export type TypographyExport2 = { embedFonts: boolean; subsetFonts: boolean; outlineRestrictedFonts: boolean; preserveVariableFonts: boolean; taggedText: boolean; searchableText: boolean; colorGlyphMode: "native" | "svg" | "raster"; missingGlyphPolicy: "warn" | "fallback" | "outline-placeholder" };
export type GlyphRun2 = { text: string; fontFamily: string; script: string; language: string; direction: "ltr" | "rtl" | "ttb"; features: OpenTypeFeature2[]; axes: Record<string, number>; glyphCount: number; fallbackUsed: boolean };

const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const unique = <T,>(items: T[]) => [...new Set(items)];
const detectScript = (text: string) => /[\u0590-\u08ff]/.test(text) ? "Arabic/Hebrew" : /[\u1200-\u137f]/.test(text) ? "Ethiopic" : /[\u3040-\u30ff\u3400-\u9fff]/.test(text) ? "CJK" : "Latin";
const directionFor = (script: string): "ltr" | "rtl" | "ttb" => script === "Arabic/Hebrew" ? "rtl" : "ltr";

export function setVariableFontAxes2(element: E, axes: VariableFontAxis2[]): E {
  const normalized = axes.map(axis => ({ ...clone(axis), value: clamp(axis.value, axis.min, axis.max), defaultValue: axis.defaultValue ?? axis.min }));
  return { ...element, typographyVariableAxes2: normalized, variableFontAxes: Object.fromEntries(normalized.map(axis => [axis.tag, axis.value])), typographyEditedAt: Date.now() };
}

export function setOpenTypeFeatures2(element: E, features: OpenTypeFeature2[]): E {
  return { ...element, typographyOpenTypeFeatures2: unique(features), ligatures: features.includes("liga"), smallCaps: features.includes("smcp") || features.includes("c2sc"), typographyEditedAt: Date.now() };
}

export function setFontFallbackChain2(element: E, fallbacks: FontFallback2[]): E {
  return { ...element, typographyFallbackChain2: fallbacks.filter(item => item.family.trim()).map(item => ({ ...clone(item), family: item.family.trim(), scripts: unique(item.scripts ?? []), languageTags: unique(item.languageTags ?? []) })), typographyEditedAt: Date.now() };
}

export function configureTextPath2(element: E, path: TextPath2): E {
  return { ...element, typographyTextPath2: { ...clone(path), startOffset: clamp(path.startOffset, -100000, 100000), baselineOffset: clamp(path.baselineOffset, -10000, 10000) }, typographyEditedAt: Date.now() };
}

export function configureParagraphComposer2(element: E, updates: Partial<ParagraphComposer2>): E {
  const defaultJustification: ParagraphComposer2["justification"] = { minWordSpacing: 80, desiredWordSpacing: 100, maxWordSpacing: 133, minLetterSpacing: -2, desiredLetterSpacing: 0, maxLetterSpacing: 3, glyphScalingMin: 97, glyphScalingMax: 103 };
  const current: ParagraphComposer2 = {
    mode: "multi-line", hyphenation: true, language: "en-US", minWordLength: 5, minBefore: 2, minAfter: 2, consecutiveHyphenLimit: 2,
    widowLines: 2, orphanLines: 2, keepTogether: false,
    ...(element.typographyParagraphComposer2 ?? {}), ...clone(updates),
    justification: { ...defaultJustification, ...(element.typographyParagraphComposer2?.justification ?? {}), ...(updates.justification ?? {}) }
  };
  current.minWordLength = clamp(current.minWordLength, 2, 32); current.minBefore = clamp(current.minBefore, 1, 16); current.minAfter = clamp(current.minAfter, 1, 16); current.consecutiveHyphenLimit = clamp(current.consecutiveHyphenLimit, 0, 20); current.widowLines = clamp(current.widowLines, 1, 20); current.orphanLines = clamp(current.orphanLines, 1, 20);
  current.justification.minWordSpacing = clamp(current.justification.minWordSpacing, 0, 1000); current.justification.desiredWordSpacing = clamp(current.justification.desiredWordSpacing, 0, 1000); current.justification.maxWordSpacing = clamp(current.justification.maxWordSpacing, 0, 1000); current.justification.glyphScalingMin = clamp(current.justification.glyphScalingMin, 50, 100); current.justification.glyphScalingMax = clamp(current.justification.glyphScalingMax, 100, 200);
  return { ...element, typographyParagraphComposer2: current, hyphenation: current.hyphenation, widowLines: current.widowLines, orphanLines: current.orphanLines, keepParagraphTogether: current.keepTogether, typographyEditedAt: Date.now() };
}

export function configureTextThread2(element: E, thread: TextThread2): E {
  const frameIds = unique(thread.frameIds.filter(Boolean));
  return { ...element, typographyTextThread2: { ...clone(thread), frameIds }, textThreadId: thread.threadId, linkedTextFrameId: frameIds.find(id => id !== element.id), typographyEditedAt: Date.now() };
}

export function setOpticalTypography2(element: E, options: { opticalAlignment?: boolean; opticalSizing?: boolean; kerning?: "metrics" | "optical" | "none"; hangingPunctuation?: boolean; baselineGrid?: boolean; baselineGridSpacing?: number }): E {
  return { ...element, typographyOptical2: { opticalAlignment: options.opticalAlignment ?? true, opticalSizing: options.opticalSizing ?? true, kerning: options.kerning ?? "optical", hangingPunctuation: options.hangingPunctuation ?? true, baselineGrid: options.baselineGrid ?? false, baselineGridSpacing: clamp(options.baselineGridSpacing ?? 14, 1, 1000) }, opticalAlignment: options.opticalAlignment ?? true, baselineGrid: options.baselineGrid ?? false, baselineGridSpacing: clamp(options.baselineGridSpacing ?? 14, 1, 1000), typographyEditedAt: Date.now() };
}

export function setTypographyExport2(element: E, options: Partial<TypographyExport2>): E {
  const value: TypographyExport2 = { embedFonts: true, subsetFonts: true, outlineRestrictedFonts: true, preserveVariableFonts: true, taggedText: true, searchableText: true, colorGlyphMode: "native", missingGlyphPolicy: "fallback", ...(element.typographyExport2 ?? {}), ...clone(options) };
  return { ...element, typographyExport2: value, typographyEditedAt: Date.now() };
}

export function shapeText2(element: E, text = String(element.text ?? ""), options: { language?: string; script?: string; direction?: "ltr" | "rtl" | "ttb" } = {}): GlyphRun2[] {
  const script = options.script ?? detectScript(text); const language = options.language ?? element.typographyParagraphComposer2?.language ?? "und"; const direction = options.direction ?? directionFor(script);
  const fallbackChain: FontFallback2[] = element.typographyFallbackChain2 ?? [];
  const primary = String(element.fontFamily ?? "Yaposan Sans");
  const fallback = fallbackChain.find(item => !item.scripts?.length || item.scripts.includes(script));
  const fallbackUsed = script !== "Latin" && Boolean(fallback);
  const fontFamily = fallbackUsed ? fallback!.family : primary;
  const features: OpenTypeFeature2[] = element.typographyOpenTypeFeatures2 ?? ["kern", "liga"];
  const axes = Object.fromEntries((element.typographyVariableAxes2 ?? []).map((axis: VariableFontAxis2) => [axis.tag, axis.value]));
  return [{ text, fontFamily, script, language, direction, features, axes, glyphCount: [...text].length, fallbackUsed }];
}

export function buildTypographyLayoutPlan2(element: E) {
  const runs = shapeText2(element);
  const text = String(element.text ?? ""); const columns = Math.max(1, Math.floor(Number(element.columnCount ?? 1))); const lineHeight = Number(element.lineHeight ?? Math.round(Number(element.fontSize ?? 16) * 1.2));
  const estimatedCharactersPerLine = Math.max(1, Math.floor(Number(element.width ?? 100) / Math.max(1, Number(element.fontSize ?? 16) * 0.55)));
  const estimatedLines = Math.max(1, Math.ceil(text.length / estimatedCharactersPerLine / columns));
  return { version: "61.0", runs, textPath: element.typographyTextPath2, composer: element.typographyParagraphComposer2, thread: element.typographyTextThread2, optical: element.typographyOptical2, export: element.typographyExport2, columns, lineHeight, estimatedLines, estimatedHeight: estimatedLines * lineHeight, overset: estimatedLines * lineHeight > Number(element.height ?? Infinity), supportsComplexScripts: true, nondestructive: true };
}

export function validateTypographyEngine2(element: E): Array<{ severity: "error" | "warning"; message: string }> {
  const plan = buildTypographyLayoutPlan2(element); const issues: Array<{ severity: "error" | "warning"; message: string }> = [];
  if (element.type !== "text") issues.push({ severity: "error", message: "Typography Engine 2 requires a text element." });
  if (!String(element.fontFamily ?? "").trim()) issues.push({ severity: "warning", message: "Primary font family is not specified." });
  if (plan.overset && !plan.thread) issues.push({ severity: "warning", message: "Text is overset and no text thread is configured." });
  if (plan.textPath && !plan.textPath.pathId) issues.push({ severity: "error", message: "Text-on-path requires a valid path ID." });
  const axes: VariableFontAxis2[] = element.typographyVariableAxes2 ?? [];
  if (axes.some(axis => axis.value < axis.min || axis.value > axis.max)) issues.push({ severity: "error", message: "A variable-font axis is outside its supported range." });
  if (plan.export?.embedFonts === false && plan.export?.searchableText && !plan.export?.outlineRestrictedFonts) issues.push({ severity: "warning", message: "Searchable export may substitute fonts because embedding and outlining are disabled." });
  return issues;
}
