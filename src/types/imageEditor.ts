export type ImageEditorBlendMode =
  | "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light"
  | "color-dodge" | "color-burn" | "difference" | "exclusion" | "hue"
  | "saturation" | "color" | "luminosity";

export type ImageEditorPanel = "layers" | "channels" | "history" | "navigator" | "histogram" | "info";
export type ImageEditorAdjustment = "brightness-contrast" | "levels" | "curves" | "exposure" | "vibrance" | "hue-saturation" | "color-balance" | "black-white" | "gradient-map" | "selective-color" | "color-lookup";
export type ImageEditorTool = "move" | "brush" | "eraser" | "clone" | "spot-heal" | "healing-brush" | "patch" | "content-aware" | "red-eye" | "quick-selection" | "magic-wand" | "object-selection" | "eyedropper";

export type ImageEditorMask = {
  id: string;
  type: "raster" | "vector";
  enabled: boolean;
  linked: boolean;
  inverted: boolean;
  density: number;
  feather: number;
};

export type ImageEditorLayer = {
  id: string;
  name: string;
  kind: "raster" | "group" | "adjustment";
  parentId?: string;
  visible: boolean;
  opacity: number;
  fillOpacity: number;
  blendMode: ImageEditorBlendMode;
  lockPosition: boolean;
  lockTransparency: boolean;
  lockPixels: boolean;
  colorLabel?: string;
  adjustment?: ImageEditorAdjustment;
  mask?: ImageEditorMask;
};

export type ImageEditorBrushSettings = {
  presetId: string;
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  spacing: number;
  scatter: number;
  angleJitter: number;
  sizeJitter: number;
  pressureEnabled: boolean;
  wetness: number;
  mix: number;
};

export type ImageEditorSelection = {
  mode: "replace" | "add" | "subtract" | "intersect";
  feather: number;
  expand: number;
  antialias: boolean;
  savedNames: string[];
};

export type ImageEditorPerformance = {
  tileSize: 128 | 256 | 512;
  backgroundRendering: boolean;
  cacheBudgetMb: number;
  gpuReady: boolean;
  largeImageOptimization: boolean;
};

export type ImageEditorState = {
  version: "17.18";
  projectId: string;
  imageUri?: string;
  selectedLayerId?: string;
  layers: ImageEditorLayer[];
  activePanel: ImageEditorPanel;
  visiblePanels: ImageEditorPanel[];
  activeTool: ImageEditorTool;
  brush: ImageEditorBrushSettings;
  selection: ImageEditorSelection;
  performance: ImageEditorPerformance;
  zoom: number;
  softProof: boolean;
  colorMode: "RGB" | "CMYK-preview";
  history: string[];
  updatedAt: number;
};
