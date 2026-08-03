import type { PublisherElement } from "../types/publisher";

export type PaintLayerBlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "color-dodge" | "color-burn";
export type PaintSymmetryMode = "none" | "horizontal" | "vertical" | "quadrant" | "radial";
export type PaintPerspectiveMode = "none" | "one-point" | "two-point" | "three-point";
export type PaintMaskMode = "none" | "layer-mask" | "clipping-mask" | "alpha-lock";

export type PaintLayer = {
  id: string;
  name: string;
  opacity: number;
  blendMode: PaintLayerBlendMode;
  visible: boolean;
  locked: boolean;
  maskMode: PaintMaskMode;
  clippedToBelow: boolean;
  createdAt: string;
};

export type PaintingCompletionSettings = {
  layerName: string;
  layerOpacity: number;
  layerBlendMode: PaintLayerBlendMode;
  maskMode: PaintMaskMode;
  symmetryMode: PaintSymmetryMode;
  radialSegments: number;
  symmetryAngle: number;
  perspectiveMode: PaintPerspectiveMode;
  perspectiveSnap: number;
  patternEnabled: boolean;
  patternWidth: number;
  patternHeight: number;
  seamlessWrap: boolean;
  strokeEditable: boolean;
  preserveVectors: boolean;
  exportPaintMetadata: boolean;
};

export const DEFAULT_PAINTING_COMPLETION_SETTINGS: PaintingCompletionSettings = {
  layerName: "Paint Layer",
  layerOpacity: 1,
  layerBlendMode: "normal",
  maskMode: "none",
  symmetryMode: "none",
  radialSegments: 6,
  symmetryAngle: 0,
  perspectiveMode: "none",
  perspectiveSnap: .65,
  patternEnabled: false,
  patternWidth: 512,
  patternHeight: 512,
  seamlessWrap: true,
  strokeEditable: true,
  preserveVectors: true,
  exportPaintMetadata: true,
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));

export function normalizePaintingCompletionSettings(value?:Partial<PaintingCompletionSettings>):PaintingCompletionSettings {
  const s={...DEFAULT_PAINTING_COMPLETION_SETTINGS,...value};
  return {
    ...s,
    layerName:String(s.layerName || "Paint Layer").slice(0,80),
    layerOpacity:clamp(Number(s.layerOpacity),.01,1),
    radialSegments:Math.round(clamp(Number(s.radialSegments),2,32)),
    symmetryAngle:clamp(Number(s.symmetryAngle),-180,180),
    perspectiveSnap:clamp(Number(s.perspectiveSnap),0,1),
    patternWidth:Math.round(clamp(Number(s.patternWidth),16,8192)),
    patternHeight:Math.round(clamp(Number(s.patternHeight),16,8192)),
  };
}

export function createPaintLayer(settings:PaintingCompletionSettings,index=0):PaintLayer {
  const s=normalizePaintingCompletionSettings(settings);
  return {
    id:`paint-layer-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    name:index ? `${s.layerName} ${index+1}` : s.layerName,
    opacity:s.layerOpacity,
    blendMode:s.layerBlendMode,
    visible:true,
    locked:false,
    maskMode:s.maskMode,
    clippedToBelow:s.maskMode === "clipping-mask",
    createdAt:new Date().toISOString(),
  };
}

export function applyPaintingCompletion(element:PublisherElement,settings:PaintingCompletionSettings):Partial<PublisherElement> {
  const s=normalizePaintingCompletionSettings(settings);
  const current=element.paintLayers ?? [];
  const layers=current.length ? current : [createPaintLayer(s,0)];
  return {
    paintLayers:layers,
    activePaintLayerId:layers[0]?.id,
    paintMaskMode:s.maskMode,
    paintSymmetry:{mode:s.symmetryMode,segments:s.radialSegments,angle:s.symmetryAngle,enabled:s.symmetryMode!=="none"},
    paintPerspective:{mode:s.perspectiveMode,snap:s.perspectiveSnap,enabled:s.perspectiveMode!=="none"},
    paintPattern:s.patternEnabled?{enabled:true,width:s.patternWidth,height:s.patternHeight,seamless:s.seamlessWrap}:undefined,
    paintStrokeEditable:s.strokeEditable,
    paintPreserveVectors:s.preserveVectors,
    paintExportMetadata:s.exportPaintMetadata,
    phase18Version:"18.3",
  };
}

export function addPaintLayer(element:PublisherElement,settings:PaintingCompletionSettings):Partial<PublisherElement> {
  const current=element.paintLayers ?? [];
  const layer=createPaintLayer(settings,current.length);
  return {paintLayers:[layer,...current],activePaintLayerId:layer.id,phase18Version:"18.3"};
}

export function buildPhase18Manifest(element:PublisherElement) {
  const layers=element.paintLayers ?? [];
  return {
    phase:"18.3",
    layerCount:layers.length,
    visibleLayers:layers.filter(layer=>layer.visible).length,
    blendModes:Array.from(new Set(layers.map(layer=>layer.blendMode))),
    maskMode:element.paintMaskMode ?? "none",
    symmetry:element.paintSymmetry?.mode ?? "none",
    perspective:element.paintPerspective?.mode ?? "none",
    seamlessPattern:Boolean(element.paintPattern?.enabled && element.paintPattern?.seamless),
    editableStrokes:element.paintStrokeEditable !== false,
    retouchOperations:element.retouchOperations?.length ?? 0,
    brushPreset:element.paintSettings?.presetId ?? null,
  };
}
