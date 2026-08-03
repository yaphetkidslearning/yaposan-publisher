import type { PublisherElement } from "../types/publisher";

export type BrushTipShape = "round" | "square" | "ellipse" | "bristle" | "rake" | "stamp" | "pixel";
export type MixerModel = "rgb" | "subtractive" | "natural-pigment";
export type StylusProfile = "mouse" | "generic-pen" | "windows-ink" | "apple-pencil" | "wacom";
export type PaintColorDepth = 8 | 16 | 32;
export type PaintInterchangeFormat = "native" | "psd-compatible" | "ora-compatible" | "flattened";

export type AdvancedPaintingSettings = {
  brushTipShape: BrushTipShape;
  brushTipRoundness: number;
  brushTipAngle: number;
  brushTipSpacing: number;
  brushTipCount: number;
  brushTipSeed: number;
  mixerEnabled: boolean;
  mixerModel: MixerModel;
  mixerWetness: number;
  mixerLoad: number;
  mixerPickup: number;
  recordStrokes: boolean;
  recordCursor: boolean;
  recordingFps: number;
  stylusProfile: StylusProfile;
  pressureCurve: number[];
  tiltEnabled: boolean;
  barrelRotationEnabled: boolean;
  palmRejection: boolean;
  largeCanvasMode: boolean;
  tileSize: number;
  maxResidentTiles: number;
  colorDepth: PaintColorDepth;
  hdrPreview: boolean;
  interchangeFormat: PaintInterchangeFormat;
  embedBrushes: boolean;
  embedTimelapse: boolean;
};

export type PaintStrokeRecording = {
  id: string;
  createdAt: string;
  fps: number;
  cursorIncluded: boolean;
  eventCount: number;
  durationMs: number;
};

export const DEFAULT_ADVANCED_PAINTING_SETTINGS: AdvancedPaintingSettings = {
  brushTipShape: "round",
  brushTipRoundness: 1,
  brushTipAngle: 0,
  brushTipSpacing: .12,
  brushTipCount: 1,
  brushTipSeed: 184,
  mixerEnabled: true,
  mixerModel: "natural-pigment",
  mixerWetness: .35,
  mixerLoad: .7,
  mixerPickup: .42,
  recordStrokes: true,
  recordCursor: false,
  recordingFps: 30,
  stylusProfile: "generic-pen",
  pressureCurve: [0,.18,.5,.82,1],
  tiltEnabled: true,
  barrelRotationEnabled: true,
  palmRejection: true,
  largeCanvasMode: true,
  tileSize: 512,
  maxResidentTiles: 64,
  colorDepth: 16,
  hdrPreview: false,
  interchangeFormat: "native",
  embedBrushes: true,
  embedTimelapse: true,
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));

export function normalizeAdvancedPaintingSettings(value?:Partial<AdvancedPaintingSettings>):AdvancedPaintingSettings {
  const s={...DEFAULT_ADVANCED_PAINTING_SETTINGS,...value};
  const curve=(Array.isArray(s.pressureCurve)?s.pressureCurve:DEFAULT_ADVANCED_PAINTING_SETTINGS.pressureCurve)
    .slice(0,9).map(value=>clamp(Number(value),0,1));
  return {
    ...s,
    brushTipRoundness:clamp(Number(s.brushTipRoundness),.05,1),
    brushTipAngle:clamp(Number(s.brushTipAngle),-180,180),
    brushTipSpacing:clamp(Number(s.brushTipSpacing),.01,5),
    brushTipCount:Math.round(clamp(Number(s.brushTipCount),1,64)),
    brushTipSeed:Math.round(clamp(Number(s.brushTipSeed),0,999999)),
    mixerWetness:clamp(Number(s.mixerWetness),0,1),
    mixerLoad:clamp(Number(s.mixerLoad),0,1),
    mixerPickup:clamp(Number(s.mixerPickup),0,1),
    recordingFps:Math.round(clamp(Number(s.recordingFps),1,60)),
    pressureCurve:curve.length>=2?curve:DEFAULT_ADVANCED_PAINTING_SETTINGS.pressureCurve,
    tileSize:[256,512,1024,2048].includes(Number(s.tileSize))?Number(s.tileSize):512,
    maxResidentTiles:Math.round(clamp(Number(s.maxResidentTiles),4,512)),
    colorDepth:([8,16,32].includes(Number(s.colorDepth))?Number(s.colorDepth):16) as PaintColorDepth,
  };
}

export function evaluatePressureCurve(pressure:number,curve:number[]):number {
  const normalized=clamp(pressure,0,1);
  const points=curve.length>=2?curve:DEFAULT_ADVANCED_PAINTING_SETTINGS.pressureCurve;
  const position=normalized*(points.length-1);
  const left=Math.floor(position);
  const right=Math.min(points.length-1,left+1);
  const mix=position-left;
  return points[left]+(points[right]-points[left])*mix;
}

export type ReturnTypeBrushTipDescriptor = {shape:BrushTipShape;roundness:number;angle:number;spacing:number;count:number;seed:number};

export function buildBrushTipDescriptor(settings:AdvancedPaintingSettings):ReturnTypeBrushTipDescriptor {
  const s=normalizeAdvancedPaintingSettings(settings);
  return {shape:s.brushTipShape,roundness:s.brushTipRoundness,angle:s.brushTipAngle,spacing:s.brushTipSpacing,count:s.brushTipCount,seed:s.brushTipSeed};
}

export function estimatePaintTileMemory(width:number,height:number,settings:AdvancedPaintingSettings) {
  const s=normalizeAdvancedPaintingSettings(settings);
  const bytesPerChannel=s.colorDepth/8;
  const totalBytes=Math.max(1,width)*Math.max(1,height)*4*bytesPerChannel;
  const tileBytes=s.tileSize*s.tileSize*4*bytesPerChannel;
  return {totalBytes,tileBytes,residentBytes:Math.min(totalBytes,tileBytes*s.maxResidentTiles),tileCount:Math.ceil(width/s.tileSize)*Math.ceil(height/s.tileSize)};
}

export function applyAdvancedPainting(element:PublisherElement,settings:AdvancedPaintingSettings):Partial<PublisherElement> {
  const s=normalizeAdvancedPaintingSettings(settings);
  const recording:PaintStrokeRecording|undefined=s.recordStrokes?{
    id:`paint-recording-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    createdAt:new Date().toISOString(),fps:s.recordingFps,cursorIncluded:s.recordCursor,eventCount:0,durationMs:0,
  }:undefined;
  return {
    paintBrushTip:buildBrushTipDescriptor(s),
    paintMixer:s.mixerEnabled?{model:s.mixerModel,wetness:s.mixerWetness,load:s.mixerLoad,pickup:s.mixerPickup}:undefined,
    paintStrokeRecording:recording,
    paintStylus:{profile:s.stylusProfile,pressureCurve:s.pressureCurve,tilt:s.tiltEnabled,barrelRotation:s.barrelRotationEnabled,palmRejection:s.palmRejection},
    paintPerformance:{largeCanvas:s.largeCanvasMode,tileSize:s.tileSize,maxResidentTiles:s.maxResidentTiles},
    paintProduction:{colorDepth:s.colorDepth,hdrPreview:s.hdrPreview,interchangeFormat:s.interchangeFormat,embedBrushes:s.embedBrushes,embedTimelapse:s.embedTimelapse},
    phase18Version:"18.4",
  };
}

export function buildPhase184Certification(element:PublisherElement) {
  return {
    phase:"18.4",
    brushTip:Boolean(element.paintBrushTip),
    mixer:Boolean(element.paintMixer),
    strokeRecording:Boolean(element.paintStrokeRecording),
    stylusProfile:element.paintStylus?.profile ?? "mouse",
    largeCanvas:Boolean(element.paintPerformance?.largeCanvas),
    colorDepth:element.paintProduction?.colorDepth ?? 8,
    interchangeFormat:element.paintProduction?.interchangeFormat ?? "native",
    priorPhaseManifest:{layers:element.paintLayers?.length ?? 0,retouch:element.retouchOperations?.length ?? 0,brushPreset:element.paintSettings?.presetId ?? null},
  };
}
