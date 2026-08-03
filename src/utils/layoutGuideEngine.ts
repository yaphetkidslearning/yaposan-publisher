import type { PublisherPage } from "../types/publisher";

export type LayoutGuide = {
  id: string;
  orientation: "horizontal" | "vertical";
  position: number;
  name: string;
  color: string;
  locked?: boolean;
  hidden?: boolean;
};

export type LayoutGridType = "square" | "modular" | "columns" | "rows" | "baseline" | "thirds" | "golden" | "fibonacci" | "diagonal" | "crosshair";

export type LayoutSettings = {
  guides: LayoutGuide[];
  guidesVisible: boolean;
  guidesLocked: boolean;
  gridVisible: boolean;
  gridType: LayoutGridType;
  gridSpacing: number;
  gridSubdivisions: number;
  gridColor: string;
  gridOpacity: number;
  columns: number;
  rows: number;
  gutter: number;
  safeArea: number;
  slug: number;
  liveArea: number;
  snapTolerance: number;
  snapToGuides: boolean;
  snapToGrid: boolean;
  snapToMargins: boolean;
  snapToBleed: boolean;
  snapToSafeArea: boolean;
  snapToPage: boolean;
  snapToObjects: boolean;
  snapToSpacing: boolean;
  snapToBaseline: boolean;
};

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  guides: [], guidesVisible: true, guidesLocked: false,
  gridVisible: false, gridType: "square", gridSpacing: 12, gridSubdivisions: 1,
  gridColor: "#2563EB", gridOpacity: 0.12, columns: 3, rows: 3, gutter: 12,
  safeArea: 24, slug: 18, liveArea: 36, snapTolerance: 6,
  snapToGuides: true, snapToGrid: true, snapToMargins: true, snapToBleed: false,
  snapToSafeArea: true, snapToPage: true, snapToObjects: true, snapToSpacing: true, snapToBaseline: false,
};

export function getLayoutSettings(page: PublisherPage): LayoutSettings {
  return { ...DEFAULT_LAYOUT_SETTINGS, ...(page.layoutSettings ?? {}), guides: page.layoutSettings?.guides ?? [] };
}

export function addLayoutGuide(page: PublisherPage, orientation: LayoutGuide["orientation"], position: number, name?: string): PublisherPage {
  const settings = getLayoutSettings(page);
  const guide: LayoutGuide = { id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, orientation, position: Math.max(0, position), name: name ?? `${orientation === "vertical" ? "V" : "H"} ${Math.round(position)}`, color: "#E11D48" };
  return { ...page, layoutSettings: { ...settings, guides: [...settings.guides, guide] } };
}

export function updateLayoutGuide(page: PublisherPage, id: string, updates: Partial<LayoutGuide>): PublisherPage {
  const settings = getLayoutSettings(page);
  return { ...page, layoutSettings: { ...settings, guides: settings.guides.map((g) => g.id === id ? { ...g, ...updates, position: Math.max(0, updates.position ?? g.position) } : g) } };
}

export function deleteLayoutGuide(page: PublisherPage, id: string): PublisherPage {
  const settings = getLayoutSettings(page);
  return { ...page, layoutSettings: { ...settings, guides: settings.guides.filter((g) => g.id !== id) } };
}

export function snapCoordinate(value: number, targets: number[], tolerance: number): { value: number; target?: number } {
  let best: number | undefined;
  let distance = Infinity;
  for (const target of targets) {
    const next = Math.abs(value - target);
    if (next <= tolerance && next < distance) { best = target; distance = next; }
  }
  return best === undefined ? { value } : { value: best, target: best };
}

export function buildSnapTargets(page: PublisherPage, axis: "x" | "y"): number[] {
  const s = getLayoutSettings(page);
  const size = axis === "x" ? page.width : page.height;
  const targets = new Set<number>([0, size / 2, size]);
  if (s.snapToMargins) { targets.add(page.margin); targets.add(size - page.margin); }
  if (s.snapToBleed) { targets.add(page.bleed); targets.add(size - page.bleed); }
  if (s.snapToSafeArea) { targets.add(s.safeArea); targets.add(size - s.safeArea); }
  if (s.snapToGuides) s.guides.filter((g) => !g.hidden && g.orientation === (axis === "x" ? "vertical" : "horizontal")).forEach((g) => targets.add(g.position));
  if (s.snapToGrid && s.gridSpacing > 0) for (let p = 0; p <= size; p += s.gridSpacing) targets.add(p);
  return [...targets];
}
