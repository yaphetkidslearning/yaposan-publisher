import type { ImageEditorAdjustment, ImageEditorLayer, ImageEditorState } from "../types/imageEditor";

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => Date.now();

export const IMAGE_EDITOR_BLEND_MODES = ["normal","multiply","screen","overlay","soft-light","hard-light","color-dodge","color-burn","difference","exclusion","hue","saturation","color","luminosity"] as const;

export function createImageEditorState(imageUri?: string): ImageEditorState {
  const baseId = id("layer");
  return {
    version: "17.18",
    projectId: id("image-project"),
    imageUri,
    selectedLayerId: baseId,
    layers: [{ id: baseId, name: "Background", kind: "raster", visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false }],
    activePanel: "layers",
    visiblePanels: ["layers", "history", "navigator", "histogram"],
    activeTool: "move",
    brush: { presetId: "round-soft", size: 48, hardness: 35, opacity: 100, flow: 70, spacing: 20, scatter: 0, angleJitter: 0, sizeJitter: 0, pressureEnabled: true, wetness: 0, mix: 0 },
    selection: { mode: "replace", feather: 0, expand: 0, antialias: true, savedNames: [] },
    performance: { tileSize: 256, backgroundRendering: true, cacheBudgetMb: 512, gpuReady: true, largeImageOptimization: true },
    zoom: 1,
    softProof: false,
    colorMode: "RGB",
    history: ["Created professional image editor project"],
    updatedAt: now(),
  };
}

function withHistory(state: ImageEditorState, message: string, patch: Partial<ImageEditorState>): ImageEditorState {
  return { ...state, ...patch, updatedAt: now(), history: [message, ...state.history].slice(0, 100) };
}

export function addRasterLayer(state: ImageEditorState, name = "New Layer"): ImageEditorState {
  const layer: ImageEditorLayer = { id: id("layer"), name, kind: "raster", visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false };
  return withHistory(state, `Added raster layer: ${name}`, { layers: [...state.layers, layer], selectedLayerId: layer.id });
}

export function addLayerGroup(state: ImageEditorState, name = "Layer Group"): ImageEditorState {
  const layer: ImageEditorLayer = { id: id("group"), name, kind: "group", visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false };
  return withHistory(state, `Added group: ${name}`, { layers: [...state.layers, layer], selectedLayerId: layer.id });
}

export function addAdjustmentLayer(state: ImageEditorState, adjustment: ImageEditorAdjustment): ImageEditorState {
  const layer: ImageEditorLayer = { id: id("adjustment"), name: adjustment.replace(/-/g, " "), kind: "adjustment", adjustment, visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false };
  return withHistory(state, `Added adjustment: ${layer.name}`, { layers: [...state.layers, layer], selectedLayerId: layer.id });
}

export function patchSelectedLayer(state: ImageEditorState, patch: Partial<ImageEditorLayer>): ImageEditorState {
  if (!state.selectedLayerId) return state;
  const layers = state.layers.map((layer) => layer.id === state.selectedLayerId ? { ...layer, ...patch } : layer);
  return withHistory(state, "Updated selected layer", { layers });
}

export function duplicateSelectedLayer(state: ImageEditorState): ImageEditorState {
  const source = state.layers.find((layer) => layer.id === state.selectedLayerId);
  if (!source) return state;
  const copy = { ...source, id: id("layer"), name: `${source.name} copy`, mask: source.mask ? { ...source.mask, id: id("mask") } : undefined };
  return withHistory(state, `Duplicated layer: ${source.name}`, { layers: [...state.layers, copy], selectedLayerId: copy.id });
}

export function removeSelectedLayer(state: ImageEditorState): ImageEditorState {
  if (!state.selectedLayerId || state.layers.length <= 1) return state;
  const layers = state.layers.filter((layer) => layer.id !== state.selectedLayerId);
  return withHistory(state, "Removed selected layer", { layers, selectedLayerId: layers.at(-1)?.id });
}

export function addMaskToSelectedLayer(state: ImageEditorState, type: "raster" | "vector"): ImageEditorState {
  return patchSelectedLayer(state, { mask: { id: id("mask"), type, enabled: true, linked: true, inverted: false, density: 100, feather: 0 } });
}

export function mergeVisibleLayers(state: ImageEditorState): ImageEditorState {
  const visible = state.layers.filter((layer) => layer.visible);
  if (visible.length < 2) return state;
  const merged: ImageEditorLayer = { id: id("merged"), name: "Merged Visible", kind: "raster", visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false };
  const hidden = state.layers.filter((layer) => !layer.visible);
  return withHistory(state, "Merged visible layers", { layers: [...hidden, merged], selectedLayerId: merged.id });
}

export function flattenImage(state: ImageEditorState): ImageEditorState {
  const flat: ImageEditorLayer = { id: id("flattened"), name: "Flattened Image", kind: "raster", visible: true, opacity: 100, fillOpacity: 100, blendMode: "normal", lockPosition: false, lockTransparency: false, lockPixels: false };
  return withHistory(state, "Flattened image", { layers: [flat], selectedLayerId: flat.id });
}

export function saveSelection(state: ImageEditorState, name: string): ImageEditorState {
  const clean = name.trim();
  if (!clean || state.selection.savedNames.includes(clean)) return state;
  return withHistory(state, `Saved selection: ${clean}`, { selection: { ...state.selection, savedNames: [...state.selection.savedNames, clean] } });
}

export function calculateLayerSummary(state: ImageEditorState) {
  return {
    total: state.layers.length,
    raster: state.layers.filter((layer) => layer.kind === "raster").length,
    groups: state.layers.filter((layer) => layer.kind === "group").length,
    adjustments: state.layers.filter((layer) => layer.kind === "adjustment").length,
    masks: state.layers.filter((layer) => Boolean(layer.mask)).length,
    visible: state.layers.filter((layer) => layer.visible).length,
  };
}
