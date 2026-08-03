import type { PublisherElement } from "../types/publisher";
import { buildRasterRenderPlan, normalizeRasterElement } from "./professionalRasterEngine";

type E = PublisherElement & Record<string, any>;
export type RasterBlendMode2 = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "color" | "luminosity" | "difference";
export type RasterFilter2 = { id: string; kind: "gaussian-blur" | "motion-blur" | "unsharp-mask" | "high-pass" | "denoise" | "dehaze" | "lens-correction" | "chromatic-aberration" | "perspective" | "liquify"; enabled: boolean; opacity: number; parameters: Record<string, number | boolean | string> };
export type RasterMask2 = { id: string; name: string; kind: "pixel" | "vector" | "luminosity" | "color-range" | "subject" | "sky"; enabled: boolean; inverted: boolean; feather: number; density: number; data?: unknown };
export type RasterSelection2 = { id: string; kind: "rectangle" | "ellipse" | "lasso" | "polygon" | "color-range" | "subject" | "sky"; feather: number; antiAlias: boolean; bounds?: { x: number; y: number; width: number; height: number }; points?: Array<{ x: number; y: number }> };
export type ContentAwareOperation = { id: string; type: "fill" | "remove" | "move" | "extend"; sourceSelectionId?: string; target?: { x: number; y: number }; preserveTexture: number; colorAdaptation: number; rotationAdaptation: number; scaleAdaptation: number };
export type RasterAdjustment2 = { id: string; kind: "exposure" | "curves" | "levels" | "hsl" | "color-balance" | "selective-color" | "gradient-map" | "black-white" | "vibrance" | "camera-raw"; enabled: boolean; opacity: number; blendMode: RasterBlendMode2; parameters: Record<string, unknown>; maskId?: string };
export type RawPipeline2 = { enabled: boolean; profile: string; whiteBalance: "as-shot" | "auto" | "custom"; temperature: number; tint: number; exposure: number; highlights: number; shadows: number; whites: number; blacks: number; texture: number; clarity: number; dehaze: number; vibrance: number; saturation: number; lensCorrection: boolean; removeChromaticAberration: boolean; noiseReduction: number; sharpening: number };
export type RasterExportPreset2 = { id: string; name: string; format: "png" | "jpg" | "webp" | "tiff" | "avif" | "psd-package"; scale: number; quality: number; colorSpace: "srgb" | "display-p3" | "adobe-rgb" | "cmyk"; bitDepth: 8 | 16 | 32; preserveMetadata: boolean; embedProfile: boolean; alpha: boolean; resize?: { width?: number; height?: number; mode: "fit" | "fill" | "stretch" }; sharpenFor?: "none" | "screen" | "matte" | "glossy" };

const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalize = (element: E): E => normalizeRasterElement(element) as E;

export function addSmartFilter2(element: E, filter: Omit<RasterFilter2, "id"> & { id?: string }): E {
  const value: RasterFilter2 = { ...clone(filter), id: filter.id ?? uid("raster-filter"), opacity: clamp(filter.opacity, 0, 1) };
  return normalize({ ...element, rasterSmartFilters2: [...(element.rasterSmartFilters2 ?? []), value], rasterEditedAt: Date.now() });
}

export function updateSmartFilter2(element: E, filterId: string, updates: Partial<RasterFilter2>): E {
  return normalize({ ...element, rasterSmartFilters2: (element.rasterSmartFilters2 ?? []).map((filter: RasterFilter2) => filter.id === filterId ? { ...filter, ...clone(updates), opacity: clamp(updates.opacity ?? filter.opacity, 0, 1) } : filter), rasterEditedAt: Date.now() });
}

export function reorderSmartFilters2(element: E, orderedIds: string[]): E {
  const filters: RasterFilter2[] = element.rasterSmartFilters2 ?? [];
  const rank = new Map(orderedIds.map((id, index) => [id, index]));
  return normalize({ ...element, rasterSmartFilters2: [...filters].sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)), rasterEditedAt: Date.now() });
}

export function addRasterMask2(element: E, mask: Partial<RasterMask2> = {}): E {
  const value: RasterMask2 = { id: mask.id ?? uid("raster-mask"), name: mask.name ?? "Layer Mask", kind: mask.kind ?? "pixel", enabled: mask.enabled ?? true, inverted: mask.inverted ?? false, feather: clamp(mask.feather ?? 0, 0, 500), density: clamp(mask.density ?? 1, 0, 1), data: clone(mask.data) };
  return normalize({ ...element, rasterMasks2: [...(element.rasterMasks2 ?? []), value], rasterEditedAt: Date.now() });
}

export function refineRasterMask2(element: E, maskId: string, options: { feather?: number; density?: number; smooth?: number; contrast?: number; shiftEdge?: number; decontaminateColor?: boolean }): E {
  return normalize({ ...element, rasterMasks2: (element.rasterMasks2 ?? []).map((mask: RasterMask2) => mask.id === maskId ? { ...mask, feather: clamp(options.feather ?? mask.feather, 0, 500), density: clamp(options.density ?? mask.density, 0, 1), refinement: { smooth: clamp(options.smooth ?? 0, 0, 100), contrast: clamp(options.contrast ?? 0, 0, 100), shiftEdge: clamp(options.shiftEdge ?? 0, -100, 100), decontaminateColor: Boolean(options.decontaminateColor) } } : mask), rasterEditedAt: Date.now() });
}

export function createRasterSelection2(element: E, selection: Omit<RasterSelection2, "id"> & { id?: string }): E {
  const value: RasterSelection2 = { ...clone(selection), id: selection.id ?? uid("selection"), feather: clamp(selection.feather, 0, 500) };
  return normalize({ ...element, rasterSelections2: [...(element.rasterSelections2 ?? []), value], activeRasterSelectionId: value.id, rasterEditedAt: Date.now() });
}

export function applyContentAwareOperation(element: E, operation: Omit<ContentAwareOperation, "id"> & { id?: string }): E {
  const value: ContentAwareOperation = { ...clone(operation), id: operation.id ?? uid("content-aware"), preserveTexture: clamp(operation.preserveTexture, 0, 1), colorAdaptation: clamp(operation.colorAdaptation, 0, 1), rotationAdaptation: clamp(operation.rotationAdaptation, 0, 1), scaleAdaptation: clamp(operation.scaleAdaptation, 0, 1) };
  return normalize({ ...element, rasterContentAwareOperations: [...(element.rasterContentAwareOperations ?? []), value], rasterEditedAt: Date.now(), rasterRequiresRender: true });
}

export function addRasterAdjustment2(element: E, adjustment: Omit<RasterAdjustment2, "id"> & { id?: string }): E {
  const value: RasterAdjustment2 = { ...clone(adjustment), id: adjustment.id ?? uid("adjustment"), opacity: clamp(adjustment.opacity, 0, 1) };
  return normalize({ ...element, rasterAdjustments2: [...(element.rasterAdjustments2 ?? []), value], rasterEditedAt: Date.now() });
}

export function setRawPipeline2(element: E, updates: Partial<RawPipeline2>): E {
  const current: RawPipeline2 = { enabled: true, profile: "Yaposan Standard", whiteBalance: "as-shot", temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, texture: 0, clarity: 0, dehaze: 0, vibrance: 0, saturation: 0, lensCorrection: true, removeChromaticAberration: true, noiseReduction: 20, sharpening: 40, ...(element.rasterRawPipeline2 ?? {}), ...clone(updates) };
  for (const key of ["temperature", "tint", "highlights", "shadows", "whites", "blacks", "texture", "clarity", "dehaze", "vibrance", "saturation"] as const) current[key] = clamp(current[key], -100, 100);
  current.exposure = clamp(current.exposure, -10, 10); current.noiseReduction = clamp(current.noiseReduction, 0, 100); current.sharpening = clamp(current.sharpening, 0, 150);
  return normalize({ ...element, rasterRawPipeline2: current, rasterEditedAt: Date.now() });
}

export function configureHdrMerge2(element: E, options: { sources: string[]; alignment?: boolean; ghostRemoval?: "off" | "low" | "medium" | "high"; toneMapping?: "natural" | "balanced" | "dramatic"; outputBitDepth?: 16 | 32 }): E {
  return normalize({ ...element, rasterHdrMerge2: { sources: [...new Set(options.sources.filter(Boolean))], alignment: options.alignment ?? true, ghostRemoval: options.ghostRemoval ?? "medium", toneMapping: options.toneMapping ?? "natural", outputBitDepth: options.outputBitDepth ?? 32 }, rasterEditedAt: Date.now(), rasterRequiresRender: true });
}

export function configurePanorama2(element: E, options: { sources: string[]; projection?: "auto" | "spherical" | "cylindrical" | "perspective"; autoCrop?: boolean; boundaryWarp?: number; fillEdges?: boolean }): E {
  return normalize({ ...element, rasterPanorama2: { sources: [...new Set(options.sources.filter(Boolean))], projection: options.projection ?? "auto", autoCrop: options.autoCrop ?? true, boundaryWarp: clamp(options.boundaryWarp ?? 0, 0, 100), fillEdges: options.fillEdges ?? true }, rasterEditedAt: Date.now(), rasterRequiresRender: true });
}

export function configureFrequencySeparation2(element: E, options: { radius: number; textureOpacity?: number; toneOpacity?: number; preserveEdges?: boolean }): E {
  return normalize({ ...element, rasterFrequencySeparation2: { enabled: true, radius: clamp(options.radius, 1, 250), textureOpacity: clamp(options.textureOpacity ?? 1, 0, 1), toneOpacity: clamp(options.toneOpacity ?? 1, 0, 1), preserveEdges: options.preserveEdges ?? true, highFrequencyLayer: uid("texture"), lowFrequencyLayer: uid("tone") }, rasterEditedAt: Date.now() });
}

export function addRasterExportPreset2(element: E, preset: Partial<RasterExportPreset2> = {}): E {
  const format = preset.format ?? "png";
  const value: RasterExportPreset2 = { id: preset.id ?? uid("raster-export"), name: preset.name ?? `Professional ${format.toUpperCase()}`, format, scale: clamp(preset.scale ?? 1, 0.1, 16), quality: clamp(preset.quality ?? (format === "jpg" ? 90 : 100), 1, 100), colorSpace: preset.colorSpace ?? "srgb", bitDepth: preset.bitDepth ?? (format === "tiff" ? 16 : 8), preserveMetadata: preset.preserveMetadata ?? true, embedProfile: preset.embedProfile ?? true, alpha: preset.alpha ?? (format === "png" || format === "webp" || format === "tiff"), resize: clone(preset.resize), sharpenFor: preset.sharpenFor ?? "screen" };
  return normalize({ ...element, rasterExportPresets2: [...(element.rasterExportPresets2 ?? []), value], rasterEditedAt: Date.now() });
}

export function buildRasterRenderPlan2(element: E) {
  const base = buildRasterRenderPlan(element);
  const smartFilters: RasterFilter2[] = (element.rasterSmartFilters2 ?? []).filter((filter: RasterFilter2) => filter.enabled);
  const adjustments: RasterAdjustment2[] = (element.rasterAdjustments2 ?? []).filter((adjustment: RasterAdjustment2) => adjustment.enabled);
  return { version: "60.0", base, source: base.source, smartFilters, adjustments, masks: element.rasterMasks2 ?? [], selections: element.rasterSelections2 ?? [], contentAwareOperations: element.rasterContentAwareOperations ?? [], rawPipeline: element.rasterRawPipeline2, hdrMerge: element.rasterHdrMerge2, panorama: element.rasterPanorama2, frequencySeparation: element.rasterFrequencySeparation2, exportPresets: element.rasterExportPresets2 ?? [], requiresGpu: smartFilters.some(filter => ["liquify", "lens-correction", "perspective"].includes(filter.kind)) || Boolean(element.rasterHdrMerge2 || element.rasterPanorama2), nondestructive: true };
}

export function validateRasterEngine2(element: E): Array<{ severity: "error" | "warning"; message: string }> {
  const plan = buildRasterRenderPlan2(element); const issues: Array<{ severity: "error" | "warning"; message: string }> = [];
  if (!plan.source) issues.push({ severity: "error", message: "Raster source is missing." });
  if (plan.hdrMerge && plan.hdrMerge.sources.length < 2) issues.push({ severity: "warning", message: "HDR merge requires at least two source images." });
  if (plan.panorama && plan.panorama.sources.length < 2) issues.push({ severity: "warning", message: "Panorama stitching requires at least two source images." });
  if (plan.smartFilters.length > 24) issues.push({ severity: "warning", message: "Large smart-filter stacks may reduce preview performance." });
  if (plan.exportPresets.some((preset: RasterExportPreset2) => preset.bitDepth === 32 && preset.format !== "tiff" && preset.format !== "psd-package")) issues.push({ severity: "warning", message: "32-bit output is only preserved by TIFF or PSD package exports." });
  return issues;
}
