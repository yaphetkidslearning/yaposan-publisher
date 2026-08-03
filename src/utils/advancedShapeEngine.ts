import type { PublisherElement } from "../types/publisher";

type E = PublisherElement & Record<string, any>;
export type VectorPoint = { x: number; y: number; inX?: number; inY?: number; outX?: number; outY?: number };
export type BooleanOperation = "union" | "subtract" | "intersect" | "exclude" | "combine";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const box = (items: E[]) => ({
  left: Math.min(...items.map(i => i.x)),
  top: Math.min(...items.map(i => i.y)),
  right: Math.max(...items.map(i => i.x + i.width)),
  bottom: Math.max(...items.map(i => i.y + i.height)),
});

export function defaultVectorPoints(element: E): VectorPoint[] {
  if (Array.isArray(element.vectorPoints) && element.vectorPoints.length) return clone(element.vectorPoints);
  return [
    { x: 0, y: 0 }, { x: element.width, y: 0 },
    { x: element.width, y: element.height }, { x: 0, y: element.height },
  ];
}

export function updateVectorPoint(element: E, index: number, point: Partial<VectorPoint>): E {
  const points = defaultVectorPoints(element);
  if (!points[index]) return element;
  points[index] = { ...points[index], ...point };
  return { ...element, vectorPoints: points, shapeKind: "custom-path" };
}

export function addVectorPoint(element: E, point: VectorPoint): E {
  return { ...element, vectorPoints: [...defaultVectorPoints(element), point], shapeKind: "custom-path" };
}

export function removeVectorPoint(element: E, index: number): E {
  const points = defaultVectorPoints(element).filter((_, i) => i !== index);
  return points.length < 3 ? element : { ...element, vectorPoints: points, shapeKind: "custom-path" };
}

// Publisher-friendly boolean operations. The result remains editable and stores
// the source geometry so a future SVG/path renderer can preserve exact curves.
export function booleanShapes(elements: E[], ids: string[], operation: BooleanOperation): E[] {
  const selected = elements.filter(e => ids.includes(e.id));
  if (selected.length < 2) return elements;
  const b = box(selected);
  const base = selected[0];
  const merged: E = {
    ...base,
    id: `boolean-${Date.now()}`,
    name: `${operation[0].toUpperCase()}${operation.slice(1)} Shape`,
    x: b.left,
    y: b.top,
    width: Math.max(1, b.right - b.left),
    height: Math.max(1, b.bottom - b.top),
    shapeKind: "compound-path",
    booleanOperation: operation,
    compoundSources: selected.map(item => ({ ...clone(item), x: item.x - b.left, y: item.y - b.top })),
    locked: false,
  };
  const rest = elements.filter(e => !ids.includes(e.id));
  return [...rest, merged].map((e, index) => ({ ...e, zIndex: index + 1 }));
}

export function createPenPath(points: VectorPoint[], style: Partial<E> = {}): E {
  const left = Math.min(...points.map(p => p.x));
  const top = Math.min(...points.map(p => p.y));
  const right = Math.max(...points.map(p => p.x));
  const bottom = Math.max(...points.map(p => p.y));
  return {
    id: `pen-${Date.now()}`, name: "Pen Path", type: "line", x: left, y: top,
    width: Math.max(1, right - left), height: Math.max(1, bottom - top), rotation: 0,
    zIndex: 1, opacity: 1, fillColor: "transparent", borderColor: "#0F172A",
    borderWidth: 3, vectorPoints: points.map(p => ({ ...p, x: p.x - left, y: p.y - top })),
    shapeKind: "bezier-path", ...style,
  } as E;
}

export function updateLiveConnectors(elements: E[]): E[] {
  const byId = new Map(elements.map(e => [e.id, e]));
  return elements.map(element => {
    if (!element.connectorStartId && !element.connectorEndId) return element;
    const start = byId.get(element.connectorStartId);
    const end = byId.get(element.connectorEndId);
    if (!start || !end) return element;
    const sx = start.x + start.width / 2, sy = start.y + start.height / 2;
    const ex = end.x + end.width / 2, ey = end.y + end.height / 2;
    return { ...element, x: Math.min(sx, ex), y: Math.min(sy, ey), width: Math.max(1, Math.abs(ex - sx)), height: Math.max(24, Math.abs(ey - sy)), connectorLive: true };
  });
}

export function serializeSelectionToSvg(elements: E[], ids: string[]): string {
  const selected = elements.filter(e => ids.includes(e.id));
  if (!selected.length) return "";
  const b = box(selected);
  const body = selected.map(e => {
    const x = e.x - b.left, y = e.y - b.top;
    const fill = e.fillColor ?? "none", stroke = e.borderColor ?? "none", sw = e.borderWidth ?? 0;
    if (e.type === "circle") return `<ellipse cx="${x + e.width / 2}" cy="${y + e.height / 2}" rx="${e.width / 2}" ry="${e.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    if (e.type === "line") return `<line x1="${x}" y1="${y + e.height / 2}" x2="${x + e.width}" y2="${y + e.height / 2}" stroke="${stroke}" stroke-width="${Math.max(1, sw)}"/>`;
    return `<rect x="${x}" y="${y}" width="${e.width}" height="${e.height}" rx="${e.borderRadius ?? 0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.right - b.left}" height="${b.bottom - b.top}" viewBox="0 0 ${b.right - b.left} ${b.bottom - b.top}">${body}</svg>`;
}

export function importSvgAsEditableShape(svgText: string): E | null {
  const width = Number(svgText.match(/width=["']([\d.]+)/i)?.[1] ?? 300);
  const height = Number(svgText.match(/height=["']([\d.]+)/i)?.[1] ?? 200);
  if (!/<svg[\s>]/i.test(svgText)) return null;
  return {
    id: `svg-${Date.now()}`, name: "Imported SVG", type: "rectangle", x: 120, y: 120,
    width, height, rotation: 0, zIndex: 1, opacity: 1, fillColor: "transparent",
    borderColor: "transparent", borderWidth: 0, shapeKind: "imported-svg", svgSource: svgText,
  } as E;
}

export function shapeMeasurements(element: E) {
  const area = Math.abs(element.width * element.height);
  const perimeter = 2 * Math.abs(element.width + element.height);
  return { area, perimeter, vertices: defaultVectorPoints(element).length };
}
