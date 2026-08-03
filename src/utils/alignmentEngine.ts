import type { PublisherElement, PublisherPage } from "../types/publisher";

export type AlignmentMode = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type AlignmentReference = "selection" | "page" | "margins" | "key-object";
export type DistributionMode = "horizontal" | "vertical";
export type MatchDimensionMode = "width" | "height" | "both";
export type MatchPositionMode = "x" | "y" | "both";

type Element = PublisherElement & Record<string, unknown>;
type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number; centerX: number; centerY: number };

const rectFor = (element: Element): Rect => ({
  left: element.x,
  top: element.y,
  right: element.x + element.width,
  bottom: element.y + element.height,
  width: element.width,
  height: element.height,
  centerX: element.x + element.width / 2,
  centerY: element.y + element.height / 2,
});

export function selectionBounds(elements: Element[]): Rect {
  if (!elements.length) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  const left = Math.min(...elements.map((element) => element.x));
  const top = Math.min(...elements.map((element) => element.y));
  const right = Math.max(...elements.map((element) => element.x + element.width));
  const bottom = Math.max(...elements.map((element) => element.y + element.height));
  return { left, top, right, bottom, width: right - left, height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
}

function referenceRect(page: PublisherPage, selected: Element[], reference: AlignmentReference, keyObjectId?: string): Rect {
  if (reference === "page") return { left: 0, top: 0, right: page.width, bottom: page.height, width: page.width, height: page.height, centerX: page.width / 2, centerY: page.height / 2 };
  if (reference === "margins") {
    const margin = Math.max(0, page.margin || 0);
    const width = Math.max(0, page.width - margin * 2);
    const height = Math.max(0, page.height - margin * 2);
    return { left: margin, top: margin, right: page.width - margin, bottom: page.height - margin, width, height, centerX: page.width / 2, centerY: page.height / 2 };
  }
  if (reference === "key-object") {
    const key = selected.find((element) => element.id === keyObjectId) ?? selected[0];
    return key ? rectFor(key) : selectionBounds(selected);
  }
  return selectionBounds(selected);
}

export function alignSelection(page: PublisherPage, ids: string[], mode: AlignmentMode, reference: AlignmentReference = "selection", keyObjectId?: string): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id)) as Element[];
  if (!selected.length) return page;
  const target = referenceRect(page, selected, reference, keyObjectId);
  return {
    ...page,
    elements: page.elements.map((element) => {
      if (!ids.includes(element.id) || element.locked) return element;
      if (reference === "key-object" && element.id === (keyObjectId ?? selected[0]?.id)) return element;
      if (mode === "left") return { ...element, x: target.left };
      if (mode === "center") return { ...element, x: target.centerX - element.width / 2 };
      if (mode === "right") return { ...element, x: target.right - element.width };
      if (mode === "top") return { ...element, y: target.top };
      if (mode === "middle") return { ...element, y: target.centerY - element.height / 2 };
      return { ...element, y: target.bottom - element.height };
    }),
  };
}

export function distributeSelection(page: PublisherPage, ids: string[], axis: DistributionMode, reference: AlignmentReference = "selection"): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id)) as Element[];
  const movable = selected.filter((element) => !element.locked);
  if (movable.length < 3) return page;
  const ordered = [...movable].sort((a, b) => axis === "horizontal" ? a.x - b.x : a.y - b.y);
  const target = referenceRect(page, selected, reference);
  const occupied = ordered.reduce((sum, element) => sum + (axis === "horizontal" ? element.width : element.height), 0);
  const span = axis === "horizontal" ? target.width : target.height;
  const gap = Math.max(0, (span - occupied) / (ordered.length - 1));
  let cursor = axis === "horizontal" ? target.left : target.top;
  const positions = new Map<string, number>();
  ordered.forEach((element) => {
    positions.set(element.id, cursor);
    cursor += (axis === "horizontal" ? element.width : element.height) + gap;
  });
  return {
    ...page,
    elements: page.elements.map((element) => positions.has(element.id)
      ? { ...element, [axis === "horizontal" ? "x" : "y"]: positions.get(element.id)! }
      : element),
  };
}

export function equalizeSpacing(page: PublisherPage, ids: string[], axis: DistributionMode, gap: number): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id) && !element.locked) as Element[];
  if (selected.length < 2) return page;
  const ordered = [...selected].sort((a, b) => axis === "horizontal" ? a.x - b.x : a.y - b.y);
  let cursor = axis === "horizontal" ? ordered[0].x : ordered[0].y;
  const positions = new Map<string, number>();
  ordered.forEach((element) => {
    positions.set(element.id, cursor);
    cursor += (axis === "horizontal" ? element.width : element.height) + Math.max(0, gap);
  });
  return { ...page, elements: page.elements.map((element) => positions.has(element.id) ? { ...element, [axis === "horizontal" ? "x" : "y"]: positions.get(element.id)! } : element) };
}

export function matchDimensions(page: PublisherPage, ids: string[], mode: MatchDimensionMode, keyObjectId?: string): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id)) as Element[];
  const key = selected.find((element) => element.id === keyObjectId) ?? selected[0];
  if (!key || selected.length < 2) return page;
  return { ...page, elements: page.elements.map((element) => {
    if (!ids.includes(element.id) || element.locked || element.id === key.id) return element;
    return { ...element, ...(mode !== "height" ? { width: key.width } : {}), ...(mode !== "width" ? { height: key.height } : {}) };
  }) };
}

export function matchPosition(page: PublisherPage, ids: string[], mode: MatchPositionMode, keyObjectId?: string): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id)) as Element[];
  const key = selected.find((element) => element.id === keyObjectId) ?? selected[0];
  if (!key || selected.length < 2) return page;
  return { ...page, elements: page.elements.map((element) => {
    if (!ids.includes(element.id) || element.locked || element.id === key.id) return element;
    return { ...element, ...(mode !== "y" ? { x: key.x } : {}), ...(mode !== "x" ? { y: key.y } : {}) };
  }) };
}

export function centerSelection(page: PublisherPage, ids: string[], target: "page" | "margins", axis: "horizontal" | "vertical" | "both" = "both"): PublisherPage {
  const selected = page.elements.filter((element) => ids.includes(element.id)) as Element[];
  if (!selected.length) return page;
  const bounds = selectionBounds(selected);
  const ref = referenceRect(page, selected, target);
  const dx = ref.centerX - bounds.centerX;
  const dy = ref.centerY - bounds.centerY;
  return { ...page, elements: page.elements.map((element) => {
    if (!ids.includes(element.id) || element.locked) return element;
    return { ...element, ...(axis !== "vertical" ? { x: element.x + dx } : {}), ...(axis !== "horizontal" ? { y: element.y + dy } : {}) };
  }) };
}

export function clampSelectionToPage(page: PublisherPage, ids: string[]): PublisherPage {
  return { ...page, elements: page.elements.map((element) => {
    if (!ids.includes(element.id) || element.locked) return element;
    return { ...element, x: Math.min(Math.max(0, element.x), Math.max(0, page.width - element.width)), y: Math.min(Math.max(0, element.y), Math.max(0, page.height - element.height)) };
  }) };
}
