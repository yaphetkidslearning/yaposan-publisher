import type { PublisherElement, PublisherPage } from "../types/publisher";

export type RenderQuality = "draft" | "standard" | "high" | "press";
export type RenderBackend = "svg" | "canvas2d" | "webgl" | "hybrid";
export type RenderColorSpace = "srgb" | "display-p3" | "cmyk-preview";
export type RenderBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
export type RenderEffect =
  | { type: "blur"; radius: number }
  | { type: "shadow"; x: number; y: number; blur: number; color: string; opacity?: number }
  | { type: "glow"; radius: number; color: string; opacity?: number }
  | { type: "opacity"; value: number }
  | { type: "color-matrix"; values: number[] };

export type RenderOptions = {
  backend?: RenderBackend;
  quality?: RenderQuality;
  colorSpace?: RenderColorSpace;
  scale?: number;
  pixelRatio?: number;
  includeBleed?: boolean;
  includeGuides?: boolean;
  transparentBackground?: boolean;
  tileSize?: number;
};

export type RenderCommand = {
  id: string;
  elementId: string;
  kind: "shape" | "text" | "image" | "svg" | "group" | "unknown";
  bounds: { x: number; y: number; width: number; height: number };
  transform: number[];
  opacity: number;
  blendMode: RenderBlendMode;
  clipPathId?: string;
  effects: RenderEffect[];
  payload: Record<string, unknown>;
};

export type RenderPlan = {
  pageId: string;
  width: number;
  height: number;
  scale: number;
  pixelRatio: number;
  backend: RenderBackend;
  quality: RenderQuality;
  colorSpace: RenderColorSpace;
  commands: RenderCommand[];
  tiles: Array<{ x: number; y: number; width: number; height: number }>;
  warnings: string[];
  fingerprint: string;
};

type E = PublisherElement & Record<string, any>;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const n = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const stable = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${stable(object[key])}`).join(",")}}`;
};
const hash = (input: string): string => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
};

export function resolveRenderBackend(elements: E[], preferred: RenderBackend = "hybrid"): RenderBackend {
  if (preferred !== "hybrid") return preferred;
  const needsWebGL = elements.some(e => Array.isArray(e.renderEffects) && e.renderEffects.some((fx: RenderEffect) => fx.type === "color-matrix" || (fx.type === "blur" && fx.radius > 24)));
  const needsSvg = elements.some(e => e.type === "svg" || e.editableVector || e.shapeKind === "compound-path");
  return needsWebGL ? "webgl" : needsSvg ? "svg" : "canvas2d";
}

export function buildRenderCommand(element: E): RenderCommand {
  const rotation = n(element.rotation) * Math.PI / 180;
  const sx = element.flipX ? -1 : 1;
  const sy = element.flipY ? -1 : 1;
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  const elementType = String(element.type);
  const kind: RenderCommand["kind"] = elementType === "text" ? "text" : elementType === "image" ? "image" : elementType === "svg" ? "svg" : elementType === "group" ? "group" : (["rectangle", "circle", "line", "triangle", "arrow", "star", "shape"].includes(elementType) || element.editableVector) ? "shape" : "unknown";
  return {
    id: `render-${element.id}`,
    elementId: element.id,
    kind,
    bounds: { x: n(element.x), y: n(element.y), width: Math.max(0, n(element.width)), height: Math.max(0, n(element.height)) },
    transform: [cos * sx, sin * sx, -sin * sy, cos * sy, n(element.x), n(element.y)],
    opacity: clamp(n(element.opacity, 1), 0, 1),
    blendMode: (element.blendMode ?? "normal") as RenderBlendMode,
    clipPathId: element.clipPathId,
    effects: Array.isArray(element.renderEffects) ? element.renderEffects : [],
    payload: {
      type: element.type,
      fillColor: element.fillColor,
      borderColor: element.borderColor,
      borderWidth: element.borderWidth,
      text: element.text,
      fontFamily: element.fontFamily,
      fontSize: element.fontSize,
      source: element.source ?? element.uri,
      vectorNodes: element.vectorNodes,
      vectorClosed: element.vectorClosed,
      vectorGradient: element.vectorGradient,
      vectorPattern: element.vectorPattern,
      vectorMeshGradient: element.vectorMeshGradient,
    },
  };
}

export function createRenderTiles(width: number, height: number, tileSize = 1024) {
  const tiles: Array<{ x: number; y: number; width: number; height: number }> = [];
  const size = Math.max(128, Math.floor(tileSize));
  for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) tiles.push({ x, y, width: Math.min(size, width - x), height: Math.min(size, height - y) });
  return tiles;
}

export function createRenderPlan(page: PublisherPage & Record<string, any>, options: RenderOptions = {}): RenderPlan {
  const scale = Math.max(0.1, n(options.scale, 1));
  const pixelRatio = Math.max(1, n(options.pixelRatio, 1));
  const quality = options.quality ?? "high";
  const colorSpace = options.colorSpace ?? "srgb";
  const elements = [...((page.elements ?? []) as E[])].filter(e => e.visible !== false).sort((a, b) => n(a.zIndex) - n(b.zIndex));
  const commands = elements.map(buildRenderCommand);
  const width = Math.max(1, Math.round(n(page.width, 816) * scale * pixelRatio));
  const height = Math.max(1, Math.round(n(page.height, 1056) * scale * pixelRatio));
  const backend = resolveRenderBackend(elements, options.backend ?? "hybrid");
  const warnings: string[] = [];
  if (width * height > 120_000_000) warnings.push("Large render surface will use tiled rendering.");
  if (colorSpace === "cmyk-preview") warnings.push("CMYK preview is simulated; final press conversion belongs in export/prepress.");
  const tiles = createRenderTiles(width, height, options.tileSize ?? (quality === "press" ? 2048 : 1024));
  const core = { pageId: page.id, width, height, scale, pixelRatio, backend, quality, colorSpace, commands, tiles };
  return { ...core, warnings, fingerprint: hash(stable(core)) };
}

export function diffRenderPlans(previous: RenderPlan, next: RenderPlan) {
  const oldMap = new Map(previous.commands.map(command => [command.elementId, hash(stable(command))]));
  const newMap = new Map(next.commands.map(command => [command.elementId, hash(stable(command))]));
  const changed = next.commands.filter(command => oldMap.get(command.elementId) !== newMap.get(command.elementId)).map(command => command.elementId);
  const removed = previous.commands.filter(command => !newMap.has(command.elementId)).map(command => command.elementId);
  return { changed, removed, fullRedraw: previous.width !== next.width || previous.height !== next.height || previous.backend !== next.backend };
}

export function applyRenderEffects(element: E, effects: RenderEffect[]): E {
  return { ...element, renderEffects: effects.map(effect => ({ ...effect })) };
}

export function certifyRenderPlan(plan: RenderPlan) {
  const errors: string[] = [];
  if (!plan.commands.every(command => command.bounds.width >= 0 && command.bounds.height >= 0)) errors.push("Invalid command bounds.");
  if (!plan.commands.every(command => command.transform.length === 6 && command.transform.every(Number.isFinite))) errors.push("Invalid transform matrix.");
  if (!Number.isFinite(plan.width) || !Number.isFinite(plan.height)) errors.push("Invalid render dimensions.");
  return { valid: errors.length === 0, errors, warnings: plan.warnings };
}
