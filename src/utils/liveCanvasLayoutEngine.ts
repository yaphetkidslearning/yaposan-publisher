import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";
import { buildSnapTargets, getLayoutSettings, type LayoutGuide } from "./layoutGuideEngine";
import { getPhase124Data, type SnapPriority } from "./layoutInteractionEngine";

export type KeyboardModifiers = { altKey?: boolean; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean };
export type LiveSnapResult = {
  x: number;
  y: number;
  vertical?: number;
  horizontal?: number;
  labelX?: string;
  labelY?: string;
};

function nearest(value: number, targets: number[], tolerance: number) {
  let best: number | undefined;
  let distance = Infinity;
  for (const target of targets) {
    const next = Math.abs(value - target);
    if (next <= tolerance && next < distance) { best = target; distance = next; }
  }
  return best === undefined ? undefined : { target: best, distance };
}

function priorityTargets(page: PublisherPage, elements: PublisherElement[], movingId: string, axis: "x" | "y", priority: SnapPriority) {
  const settings = getLayoutSettings(page);
  const size = axis === "x" ? page.width : page.height;
  if (priority === "page") return [0, size / 2, size];
  if (priority === "margins") return [page.margin, size - page.margin, settings.safeArea, size - settings.safeArea];
  if (priority === "guides") return settings.guides.filter((g) => !g.hidden && g.orientation === (axis === "x" ? "vertical" : "horizontal")).map((g) => g.position);
  if (priority === "grid") return buildSnapTargets(page, axis).filter((value) => settings.gridSpacing > 0 && Math.abs(value / settings.gridSpacing - Math.round(value / settings.gridSpacing)) < 0.001);
  return elements.filter((e) => e.id !== movingId && !e.hidden).flatMap((e) => axis === "x" ? [e.x, e.x + e.width / 2, e.x + e.width] : [e.y, e.y + e.height / 2, e.y + e.height]);
}

export function resolveLiveSnap(project: PublisherProject, page: PublisherPage, element: PublisherElement, x: number, y: number, modifiers: KeyboardModifiers = {}): LiveSnapResult {
  const interaction = getPhase124Data(project).interaction;
  const settings = getLayoutSettings(page);
  if (interaction.altDisablesSnap && modifiers.altKey) return { x, y };
  const tolerance = Math.max(1, settings.snapTolerance * Math.max(0.25, interaction.magnetStrength));
  let nextX = x, nextY = y;
  let vertical: number | undefined, horizontal: number | undefined;
  let labelX: string | undefined, labelY: string | undefined;
  const xCandidates = [x, x + element.width / 2, x + element.width];
  const yCandidates = [y, y + element.height / 2, y + element.height];
  for (const priority of interaction.snapPriority) {
    const xs = priorityTargets(page, page.elements, element.id, "x", priority);
    const ys = priorityTargets(page, page.elements, element.id, "y", priority);
    if (vertical === undefined) {
      for (let index = 0; index < xCandidates.length; index += 1) {
        const hit = nearest(xCandidates[index], xs, tolerance);
        if (hit) { nextX += hit.target - xCandidates[index]; vertical = hit.target; labelX = priority; break; }
      }
    }
    if (horizontal === undefined) {
      for (let index = 0; index < yCandidates.length; index += 1) {
        const hit = nearest(yCandidates[index], ys, tolerance);
        if (hit) { nextY += hit.target - yCandidates[index]; horizontal = hit.target; labelY = priority; break; }
      }
    }
    if (vertical !== undefined && horizontal !== undefined) break;
  }
  return { x: nextX, y: nextY, vertical, horizontal, labelX, labelY };
}

export function guideFromRuler(page: PublisherPage, orientation: LayoutGuide["orientation"], screenPosition: number, zoom: number): LayoutGuide {
  const position = Math.max(0, screenPosition / Math.max(0.01, zoom));
  return { id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, orientation, position, name: `${orientation === "vertical" ? "V" : "H"} ${Math.round(position)}`, color: "#E11D48" };
}

export function applyGuideDrop(page: PublisherPage, guide: LayoutGuide): PublisherPage {
  const settings = getLayoutSettings(page);
  return { ...page, layoutSettings: { ...settings, guides: [...settings.guides, guide] } };
}

export function pasteboardBounds(project: PublisherProject, page: PublisherPage) {
  const size = Math.max(0, getPhase124Data(project).interaction.pasteboardSize);
  return { x: -size, y: -size, width: page.width + size * 2, height: page.height + size * 2 };
}

export function spreadGeometry(project: PublisherProject) {
  const gap = project.spreadSettings?.pageGap ?? 24;
  const facing = project.spreadSettings?.facingPages ?? false;
  const pages = project.pages.map((page, index) => ({ pageId: page.id, index, width: page.width, height: page.height }));
  let x = 0;
  return pages.map((page, index) => {
    const left = facing && index % 2 === 1 ? x - page.width - gap : x;
    const result = { ...page, x: left, y: 0, spreadIndex: facing ? Math.floor(index / 2) : index, side: facing ? (index % 2 === 0 ? "right" : "left") : "single" } as const;
    if (!facing || index % 2 === 0) x += page.width + gap;
    return result;
  });
}

export function layerAllowsRendering(project: PublisherProject, element: PublisherElement, forExport = false) {
  const layer = project.layers?.find((item) => item.id === element.layerId);
  if (!layer) return !element.hidden;
  if (!layer.visible || element.hidden) return false;
  if (forExport && (layer.exportEnabled === false || layer.printable === false)) return false;
  return true;
}

export function detectAnchorCycles(page: PublisherPage): string[][] {
  const edges = new Map(page.elements.filter((e) => e.anchorMode === "frame" && e.anchorTargetId).map((e) => [e.id, e.anchorTargetId!]));
  const cycles: string[][] = [];
  for (const start of edges.keys()) {
    const seen = new Map<string, number>();
    const path: string[] = [];
    let current: string | undefined = start;
    while (current && edges.has(current)) {
      if (seen.has(current)) { cycles.push(path.slice(seen.get(current))); break; }
      seen.set(current, path.length); path.push(current); current = edges.get(current);
    }
  }
  return cycles.filter((cycle, index, all) => all.findIndex((other) => [...other].sort().join("|") === [...cycle].sort().join("|")) === index);
}

export function refreshLiveAnchors(page: PublisherPage): PublisherPage {
  const cycles = new Set(detectAnchorCycles(page).flat());
  return { ...page, elements: page.elements.map((element) => {
    if (!element.anchorMode || element.anchorMode === "none" || cycles.has(element.id)) return element;
    const target = element.anchorMode === "page" ? { x: 0, y: 0 } : element.anchorMode === "margins" ? { x: page.margin, y: page.margin } : page.elements.find((item) => item.id === element.anchorTargetId && item.isFrame);
    if (!target) return element;
    return { ...element, x: element.anchorLockX ? element.x : target.x + (element.anchorOffsetX ?? 0), y: element.anchorLockY ? element.y : target.y + (element.anchorOffsetY ?? 0) };
  }) };
}
