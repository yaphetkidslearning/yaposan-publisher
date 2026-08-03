import type { PublisherElement, PublisherPage } from "../types/publisher";

type E = PublisherElement & Record<string, any>;
type P = PublisherPage & Record<string, any>;
export type LayoutBreakpoint2 = { id: string; minWidth: number; maxWidth?: number; columns: number; gutter: number; margin: number; scaleTypography?: number };
export type LayoutConstraint2 = { left?: number; right?: number; top?: number; bottom?: number; centerX?: boolean; centerY?: boolean; widthMode?: "fixed" | "fill" | "hug" | "proportional"; heightMode?: "fixed" | "fill" | "hug" | "proportional"; minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number; aspectRatio?: number };
export type GridDefinition2 = { type: "column" | "row" | "modular" | "baseline"; columns?: number; rows?: number; gutterX?: number; gutterY?: number; marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number; baseline?: number; visible?: boolean; snap?: boolean };
export type AnchorDefinition2 = { mode: "page" | "margin" | "column" | "text" | "object"; targetId?: string; horizontal: "left" | "center" | "right" | "inside" | "outside"; vertical: "top" | "center" | "bottom" | "baseline"; offsetX: number; offsetY: number; moveWithText?: boolean; keepWithinBounds?: boolean };
export type ReflowRule2 = { priority: number; allowMove: boolean; allowResize: boolean; allowReorder: boolean; allowHide: boolean; preserveReadingOrder: boolean; overflow: "clip" | "scale" | "continue" | "new-page"; collision: "overlap" | "push" | "wrap" | "avoid" };
export type MasterPage2 = { id: string; name: string; basedOn?: string; lockedElementIds: string[]; overridesAllowed: boolean; sectionStart?: boolean; pageNumberStyle?: "arabic" | "roman-upper" | "roman-lower" | "letters-upper" | "letters-lower" };
export type Imposition2 = { mode: "single" | "facing-pages" | "booklet" | "n-up" | "signature"; sheetWidth: number; sheetHeight: number; rows: number; columns: number; gutter: number; bleed: number; creep: number; duplex: boolean; binding: "left" | "right" | "top" | "none" };
export type LayoutFrame2 = { id: string; x: number; y: number; width: number; height: number; pageId?: string; hidden?: boolean; sourceId?: string };

const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const unique = <T,>(items: T[]) => [...new Set(items)];

export function setLayoutConstraints2(element: E, constraints: LayoutConstraint2): E {
  const value = { ...clone(constraints) };
  if (value.minWidth !== undefined) value.minWidth = Math.max(0, value.minWidth);
  if (value.minHeight !== undefined) value.minHeight = Math.max(0, value.minHeight);
  if (value.maxWidth !== undefined) value.maxWidth = Math.max(value.minWidth ?? 0, value.maxWidth);
  if (value.maxHeight !== undefined) value.maxHeight = Math.max(value.minHeight ?? 0, value.maxHeight);
  if (value.aspectRatio !== undefined) value.aspectRatio = clamp(value.aspectRatio, 0.01, 100);
  return { ...element, layoutConstraints2: value, layoutEditedAt: Date.now() };
}

export function setResponsiveBreakpoints2(page: P, breakpoints: LayoutBreakpoint2[]): P {
  const normalized = breakpoints
    .filter(item => item.id.trim())
    .map(item => ({ ...clone(item), minWidth: Math.max(0, item.minWidth), maxWidth: item.maxWidth === undefined ? undefined : Math.max(item.minWidth, item.maxWidth), columns: Math.max(1, Math.floor(item.columns)), gutter: Math.max(0, item.gutter), margin: Math.max(0, item.margin), scaleTypography: clamp(item.scaleTypography ?? 1, 0.25, 4) }))
    .sort((a, b) => a.minWidth - b.minWidth);
  return { ...page, responsiveBreakpoints2: normalized, layoutEditedAt: Date.now() };
}

export function setAdvancedGrid2(page: P, grid: GridDefinition2): P {
  const value: GridDefinition2 = { ...clone(grid), columns: Math.max(1, Math.floor(grid.columns ?? 1)), rows: Math.max(1, Math.floor(grid.rows ?? 1)), gutterX: Math.max(0, grid.gutterX ?? 0), gutterY: Math.max(0, grid.gutterY ?? 0), marginTop: Math.max(0, grid.marginTop ?? 0), marginRight: Math.max(0, grid.marginRight ?? 0), marginBottom: Math.max(0, grid.marginBottom ?? 0), marginLeft: Math.max(0, grid.marginLeft ?? 0), baseline: Math.max(1, grid.baseline ?? 12), visible: grid.visible ?? true, snap: grid.snap ?? true };
  return { ...page, advancedGrid2: value, layoutEditedAt: Date.now() };
}

export function setAnchor2(element: E, anchor: AnchorDefinition2): E {
  return { ...element, layoutAnchor2: { ...clone(anchor), offsetX: clamp(anchor.offsetX, -100000, 100000), offsetY: clamp(anchor.offsetY, -100000, 100000) }, layoutEditedAt: Date.now() };
}

export function setReflowRule2(element: E, rule: Partial<ReflowRule2>): E {
  const current: ReflowRule2 = { priority: 100, allowMove: true, allowResize: true, allowReorder: true, allowHide: false, preserveReadingOrder: true, overflow: "continue", collision: "push", ...(element.layoutReflowRule2 ?? {}), ...clone(rule) };
  current.priority = Math.max(0, Math.floor(current.priority));
  return { ...element, layoutReflowRule2: current, layoutEditedAt: Date.now() };
}

export function setMasterPage2(page: P, master: MasterPage2): P {
  return { ...page, masterPage2: { ...clone(master), lockedElementIds: unique(master.lockedElementIds.filter(Boolean)) }, layoutEditedAt: Date.now() };
}

export function applyMasterOverrides2(page: P, overrides: Record<string, Partial<E>>): P {
  const master: MasterPage2 | undefined = page.masterPage2;
  const elements: E[] = (page.elements ?? []).map((element: E) => {
    const patch = overrides[element.id];
    if (!patch) return element;
    if (master?.lockedElementIds.includes(element.id) && !master.overridesAllowed) return element;
    return { ...element, ...clone(patch), id: element.id };
  });
  return { ...page, elements, masterOverrides2: clone(overrides), layoutEditedAt: Date.now() };
}

export function setImposition2(document: Record<string, any>, imposition: Imposition2) {
  const value: Imposition2 = { ...clone(imposition), sheetWidth: Math.max(1, imposition.sheetWidth), sheetHeight: Math.max(1, imposition.sheetHeight), rows: Math.max(1, Math.floor(imposition.rows)), columns: Math.max(1, Math.floor(imposition.columns)), gutter: Math.max(0, imposition.gutter), bleed: Math.max(0, imposition.bleed), creep: clamp(imposition.creep, -100, 100) };
  return { ...document, layoutImposition2: value, layoutEditedAt: Date.now() };
}

export function resolveResponsiveLayout2(page: P, viewportWidth: number, viewportHeight = Number(page.height ?? 1000)): { breakpoint?: LayoutBreakpoint2; frames: LayoutFrame2[]; scale: number } {
  const breakpoints: LayoutBreakpoint2[] = page.responsiveBreakpoints2 ?? [];
  const breakpoint = [...breakpoints].reverse().find(item => viewportWidth >= item.minWidth && (item.maxWidth === undefined || viewportWidth <= item.maxWidth));
  const sourceWidth = Math.max(1, Number(page.width ?? viewportWidth));
  const sourceHeight = Math.max(1, Number(page.height ?? viewportHeight));
  const scale = viewportWidth / sourceWidth;
  const frames: LayoutFrame2[] = (page.elements ?? []).map((element: E) => {
    const c: LayoutConstraint2 = element.layoutConstraints2 ?? {};
    let width = Number(element.width ?? 0) * scale;
    let height = Number(element.height ?? 0) * scale;
    let x = Number(element.x ?? 0) * scale;
    let y = Number(element.y ?? 0) * (viewportHeight / sourceHeight);
    if (c.left !== undefined) x = c.left;
    if (c.right !== undefined && c.left !== undefined) width = viewportWidth - c.left - c.right;
    else if (c.right !== undefined) x = viewportWidth - c.right - width;
    if (c.top !== undefined) y = c.top;
    if (c.bottom !== undefined && c.top !== undefined) height = viewportHeight - c.top - c.bottom;
    else if (c.bottom !== undefined) y = viewportHeight - c.bottom - height;
    if (c.centerX) x = (viewportWidth - width) / 2;
    if (c.centerY) y = (viewportHeight - height) / 2;
    if (c.widthMode === "fill") width = viewportWidth - (c.left ?? 0) - (c.right ?? 0);
    if (c.heightMode === "fill") height = viewportHeight - (c.top ?? 0) - (c.bottom ?? 0);
    width = clamp(width, c.minWidth ?? 0, c.maxWidth ?? Number.MAX_SAFE_INTEGER);
    height = clamp(height, c.minHeight ?? 0, c.maxHeight ?? Number.MAX_SAFE_INTEGER);
    if (c.aspectRatio) height = width / c.aspectRatio;
    const hide = element.layoutReflowRule2?.allowHide && viewportWidth < Number(element.hideBelowWidth ?? 0);
    return { id: element.id, x, y, width, height, pageId: page.id, hidden: hide, sourceId: element.id };
  });
  return { breakpoint, frames, scale: breakpoint?.scaleTypography ?? scale };
}

export function resolveCollisions2(frames: LayoutFrame2[], gap = 8): LayoutFrame2[] {
  const result = clone(frames).sort((a, b) => a.y - b.y || a.x - b.x);
  for (let i = 1; i < result.length; i++) {
    const current = result[i];
    if (current.hidden) continue;
    for (let j = 0; j < i; j++) {
      const previous = result[j];
      if (previous.hidden) continue;
      const overlapsX = current.x < previous.x + previous.width && current.x + current.width > previous.x;
      const overlapsY = current.y < previous.y + previous.height && current.y + current.height > previous.y;
      if (overlapsX && overlapsY) current.y = previous.y + previous.height + gap;
    }
  }
  return result;
}

export function buildImpositionPlan2(pageCount: number, options: Imposition2) {
  const slotsPerSide = Math.max(1, options.rows * options.columns);
  const sides = options.duplex ? 2 : 1;
  const sheets = Math.ceil(pageCount / (slotsPerSide * sides));
  const placements: Array<{ pageNumber: number; sheet: number; side: "front" | "back"; row: number; column: number; x: number; y: number }> = [];
  const cellWidth = (options.sheetWidth - options.gutter * (options.columns - 1)) / options.columns;
  const cellHeight = (options.sheetHeight - options.gutter * (options.rows - 1)) / options.rows;
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const index = pageNumber - 1; const sheet = Math.floor(index / (slotsPerSide * sides)) + 1; const onSheet = index % (slotsPerSide * sides); const side: "front" | "back" = options.duplex && onSheet >= slotsPerSide ? "back" : "front"; const slot = onSheet % slotsPerSide; const row = Math.floor(slot / options.columns); const column = slot % options.columns;
    placements.push({ pageNumber, sheet, side, row, column, x: column * (cellWidth + options.gutter), y: row * (cellHeight + options.gutter) });
  }
  return { version: "62.0", sheets, slotsPerSide, placements, cellWidth, cellHeight, bookletReady: options.mode === "booklet" ? pageCount % 4 === 0 : true };
}

export function buildLayoutPlan2(page: P, viewportWidth = Number(page.width ?? 1000), viewportHeight = Number(page.height ?? 1000)) {
  const responsive = resolveResponsiveLayout2(page, viewportWidth, viewportHeight);
  const frames = resolveCollisions2(responsive.frames, Number(page.layoutCollisionGap2 ?? 8));
  return { version: "62.0", pageId: page.id, breakpoint: responsive.breakpoint, grid: page.advancedGrid2, master: page.masterPage2, frames, scale: responsive.scale, readingOrder: frames.filter(frame => !frame.hidden).map(frame => frame.id), adaptiveReflow: true, supportsSpreads: true, supportsAnchoredObjects: true, nondestructive: true };
}

export function validateLayoutEngine2(page: P): Array<{ severity: "error" | "warning"; message: string }> {
  const issues: Array<{ severity: "error" | "warning"; message: string }> = [];
  if (Number(page.width ?? 0) <= 0 || Number(page.height ?? 0) <= 0) issues.push({ severity: "error", message: "Page dimensions must be greater than zero." });
  const breakpoints: LayoutBreakpoint2[] = page.responsiveBreakpoints2 ?? [];
  for (let i = 1; i < breakpoints.length; i++) if (breakpoints[i].minWidth < breakpoints[i - 1].minWidth) issues.push({ severity: "error", message: "Responsive breakpoints must be ordered by minimum width." });
  const ids = new Set<string>();
  for (const element of page.elements ?? []) {
    if (ids.has(element.id)) issues.push({ severity: "error", message: `Duplicate element ID: ${element.id}` });
    ids.add(element.id);
    const anchor: AnchorDefinition2 | undefined = (element as E).layoutAnchor2;
    if (anchor?.mode === "object" && anchor.targetId && !((page.elements ?? []).some((candidate: E) => candidate.id === anchor.targetId))) issues.push({ severity: "warning", message: `Anchor target not found: ${anchor.targetId}` });
  }
  const master: MasterPage2 | undefined = page.masterPage2;
  for (const id of master?.lockedElementIds ?? []) if (!ids.has(id)) issues.push({ severity: "warning", message: `Master page references missing element: ${id}` });
  return issues;
}
