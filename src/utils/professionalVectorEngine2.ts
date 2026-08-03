import type { PublisherElement } from "../types/publisher";
import {
  applyMeshGradient,
  applyVariableWidth,
  applyVectorLiveEffect,
  createCompoundVector,
  createLiveShape,
  normalizeVectorElement,
  setVectorPattern,
  vectorPathData,
  type LiveShapeKind,
  type ProfessionalVectorNode,
  type VectorBooleanOperation,
  type VectorPattern,
} from "./professionalVectorEngine";

type E = PublisherElement & Record<string, any>;
export type MeshPatch = { x: number; y: number; color: string; opacity?: number; tension?: number };
export type MeshGradient = { rows: number; columns: number; points: MeshPatch[]; interpolation?: "bilinear" | "bicubic" };
export type WidthPoint = { offset: number; width: number };
export type VectorEffect2 = { id: string; type: "offset-path" | "roughen" | "zigzag" | "twist" | "round-corners" | "warp"; amount: number; enabled: boolean };

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const nodes = (element: E): ProfessionalVectorNode[] => clone(element.vectorNodes ?? element.vectorPoints ?? []);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function booleanVectorOperation(elements: E[], ids: string[], operation: VectorBooleanOperation) {
  return createCompoundVector(elements, ids, operation);
}

export function createCompoundPath(elements: E[], ids: string[], fillRule: "nonzero" | "evenodd" = "evenodd") {
  const result = createCompoundVector(elements, ids, "combine");
  return { ...result, created: result.created ? { ...result.created, vectorWinding: fillRule, compoundPath: true } : null };
}

export function setMeshGradient(element: E, mesh: MeshGradient): E {
  const rows = Math.max(2, Math.round(mesh.rows));
  const columns = Math.max(2, Math.round(mesh.columns));
  const expected = rows * columns;
  const points = mesh.points.slice(0, expected).map(point => ({ ...point, x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)), opacity: Math.max(0, Math.min(1, point.opacity ?? 1)), tension: Math.max(0, Math.min(1, point.tension ?? .5)) }));
  while (points.length < expected) {
    const index = points.length, row = Math.floor(index / columns), column = index % columns;
    points.push({ x: column / (columns - 1), y: row / (rows - 1), color: "#7C3AED", opacity: 1, tension: .5 });
  }
  return { ...(applyMeshGradient(element) as E), vectorMeshGradient: { rows, columns, points, interpolation: mesh.interpolation ?? "bicubic", editable: true }, fillColor: "transparent" } as E;
}

export function setAdvancedPatternFill(element: E, pattern: VectorPattern & { scaleX?: number; scaleY?: number; offsetX?: number; offsetY?: number }): E {
  return { ...setVectorPattern(element, pattern), vectorPatternTransform: { scaleX: pattern.scaleX ?? 1, scaleY: pattern.scaleY ?? 1, offsetX: pattern.offsetX ?? 0, offsetY: pattern.offsetY ?? 0, rotation: pattern.angle ?? 0 } };
}

export function setVariableWidthProfile(element: E, profile: WidthPoint[]): E {
  const normalized = profile.map(point => ({ offset: Math.max(0, Math.min(1, point.offset)), width: Math.max(.01, point.width) })).sort((a, b) => a.offset - b.offset);
  return ({ ...(applyVariableWidth(element, "uniform", 1) as E), vectorWidthProfile: { profile: "custom", points: normalized }, variableWidthStroke: true } as unknown) as E;
}

export function insertVectorNode(element: E, index: number, node: ProfessionalVectorNode): E {
  const list = nodes(element); list.splice(Math.max(0, Math.min(list.length, index)), 0, clone(node));
  return { ...normalizeVectorElement(element), vectorNodes: list, vectorPoints: list };
}
export function deleteVectorNodes(element: E, indices: number[]): E {
  const removed = new Set(indices); const list = nodes(element).filter((_, index) => !removed.has(index));
  return { ...normalizeVectorElement(element), vectorNodes: list, vectorPoints: list, vectorClosed: list.length >= 3 ? element.vectorClosed : false };
}
export function moveVectorNode(element: E, index: number, dx: number, dy: number, moveHandles = true): E {
  const list = nodes(element); const node = list[index]; if (!node) return normalizeVectorElement(element);
  list[index] = { ...node, x: node.x + dx, y: node.y + dy, inX: moveHandles && node.inX != null ? node.inX + dx : node.inX, inY: moveHandles && node.inY != null ? node.inY + dy : node.inY, outX: moveHandles && node.outX != null ? node.outX + dx : node.outX, outY: moveHandles && node.outY != null ? node.outY + dy : node.outY };
  return { ...normalizeVectorElement(element), vectorNodes: list, vectorPoints: list };
}
export function convertNodeKind(element: E, index: number, kind: "corner" | "smooth" | "symmetric"): E {
  const list = nodes(element); const node = list[index]; if (!node) return normalizeVectorElement(element);
  const span = Math.max(8, Math.hypot((node.outX ?? node.x + 12) - node.x, (node.outY ?? node.y) - node.y));
  list[index] = kind === "corner" ? { ...node, kind, inX: undefined, inY: undefined, outX: undefined, outY: undefined } : { ...node, kind, inX: node.x - span, inY: node.y, outX: node.x + span, outY: node.y };
  return { ...normalizeVectorElement(element), vectorNodes: list, vectorPoints: list };
}

export function convertLiveShapeToPath(element: E, kind?: LiveShapeKind, parameters: Record<string, number> = {}): E {
  const live = kind ? createLiveShape(element, kind, parameters) : normalizeVectorElement(element);
  return { ...(live as E), liveShape: live.liveShape ? { ...live.liveShape, editable: false, converted: true } : undefined, shapeKind: "custom-path", editableVector: true } as E;
}

export function addVectorEffect(element: E, effect: Omit<VectorEffect2, "id">): E {
  const vectorEffects: VectorEffect2[] = [...(element.vectorEffects2 ?? []), { ...effect, id: uid("vector-effect") }];
  let output = { ...normalizeVectorElement(element), vectorEffects2: vectorEffects };
  if (effect.enabled && ["roughen", "zigzag", "twist"].includes(effect.type)) output = { ...applyVectorLiveEffect(output, effect.type as "roughen" | "zigzag" | "twist", effect.amount), vectorEffects2: vectorEffects };
  return output;
}

export function exportVectorSvg2(element: E, options: { includeMetadata?: boolean; precision?: number } = {}): string {
  const precision = Math.max(0, Math.min(6, options.precision ?? 3));
  const d = vectorPathData(element).replace(/-?\d+(?:\.\d+)?/g, value => Number(value).toFixed(precision).replace(/\.?0+$/, ""));
  const width = Math.max(1, Number(element.width) || 100), height = Math.max(1, Number(element.height) || 100);
  const metadata = options.includeMetadata ? `<metadata>{"generator":"Yaposan Professional Vector Engine 2","editable":true}</metadata>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${metadata}<path d="${d}" fill="${element.fillColor ?? "none"}" stroke="${element.borderColor ?? "none"}" stroke-width="${element.borderWidth ?? 0}" fill-rule="${element.vectorWinding ?? "nonzero"}"/></svg>`;
}

export function importVectorSvg2(svg: string): E[] {
  const pathRegex = /<path\b([^>]*)>/gi; const elements: E[] = []; let match: RegExpExecArray | null;
  const attr = (source: string, name: string) => source.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
  while ((match = pathRegex.exec(svg))) {
    const attributes = match[1]; const d = attr(attributes, "d") ?? "";
    const pointMatches = [...d.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)\s*[ ,]\s*(-?\d+(?:\.\d+)?)/gi)];
    const vectorNodes = pointMatches.map(point => ({ x: Number(point[1]), y: Number(point[2]), kind: "corner" as const }));
    elements.push(({ id: uid("imported-svg"), name: "Imported SVG Path", type: "svg", x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, visible: true, locked: false, zIndex: elements.length + 1, shapeKind: "imported-svg", editableVector: true, vectorNodes, vectorPoints: vectorNodes, vectorClosed: /Z/i.test(d), svgPathData: d, fillColor: attr(attributes, "fill") ?? "transparent", borderColor: attr(attributes, "stroke") ?? "transparent", borderWidth: Number(attr(attributes, "stroke-width") ?? 0), vectorWinding: attr(attributes, "fill-rule") ?? "nonzero" } as unknown) as E);
  }
  return elements;
}
