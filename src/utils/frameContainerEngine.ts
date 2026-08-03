import type { PublisherElement, PublisherPage } from "../types/publisher";

export type AnchorMode = "none" | "page" | "margins" | "frame";
export type FrameFitMode = "none" | "fit-content" | "fit-frame" | "center-content";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function selectionFrameBounds(elements: PublisherElement[], ids: string[], padding = 16) {
  const selected = elements.filter((element) => ids.includes(element.id));
  if (!selected.length) return null;
  const left = Math.min(...selected.map((element) => element.x));
  const top = Math.min(...selected.map((element) => element.y));
  const right = Math.max(...selected.map((element) => element.x + element.width));
  const bottom = Math.max(...selected.map((element) => element.y + element.height));
  return { x: left - padding, y: top - padding, width: right - left + padding * 2, height: bottom - top + padding * 2 };
}

export function createFrameFromSelection(page: PublisherPage, ids: string[], padding = 16): { page: PublisherPage; frameId?: string } {
  const bounds = selectionFrameBounds(page.elements, ids, padding);
  if (!bounds || ids.length === 0) return { page };
  const frameId = uid("frame");
  const topZ = Math.max(0, ...page.elements.map((element) => element.zIndex));
  const frame: PublisherElement = {
    id: frameId,
    name: "Container Frame",
    type: "rectangle",
    ...bounds,
    rotation: 0,
    zIndex: Math.max(0, topZ - 1),
    opacity: 1,
    fillColor: "transparent",
    borderColor: "#0F766E",
    borderWidth: 1,
    isFrame: true,
    framePadding: padding,
    frameClipContent: true,
    frameFitMode: "none",
  };
  return {
    frameId,
    page: {
      ...page,
      elements: [frame, ...page.elements.map((element) => ids.includes(element.id) ? { ...element, parentFrameId: frameId } : element)],
    },
  };
}

export function detachFromFrame(page: PublisherPage, ids: string[]): PublisherPage {
  return { ...page, elements: page.elements.map((element) => ids.includes(element.id) ? { ...element, parentFrameId: undefined, anchorMode: "none", anchorTargetId: undefined } : element) };
}

export function removeFrame(page: PublisherPage, frameId: string, keepChildren = true): PublisherPage {
  return {
    ...page,
    elements: page.elements
      .filter((element) => keepChildren ? element.id !== frameId : element.id !== frameId && element.parentFrameId !== frameId)
      .map((element) => element.parentFrameId === frameId ? { ...element, parentFrameId: undefined, anchorMode: "none", anchorTargetId: undefined } : element),
  };
}

export function updateFrameSettings(page: PublisherPage, frameId: string, updates: Partial<PublisherElement>): PublisherPage {
  return { ...page, elements: page.elements.map((element) => element.id === frameId && element.isFrame ? { ...element, ...updates } : element) };
}

export function anchorElements(page: PublisherPage, ids: string[], mode: AnchorMode, targetId?: string): PublisherPage {
  return { ...page, elements: page.elements.map((element) => {
    if (!ids.includes(element.id) || element.locked) return element;
    const target = mode === "frame" ? page.elements.find((item) => item.id === targetId && item.isFrame) : undefined;
    const rect = mode === "page" ? { x: 0, y: 0, width: page.width, height: page.height }
      : mode === "margins" ? { x: page.margin, y: page.margin, width: page.width - page.margin * 2, height: page.height - page.margin * 2 }
      : target;
    return {
      ...element,
      anchorMode: mode,
      anchorTargetId: mode === "frame" ? targetId : undefined,
      anchorOffsetX: rect ? element.x - rect.x : undefined,
      anchorOffsetY: rect ? element.y - rect.y : undefined,
      parentFrameId: mode === "frame" && target ? target.id : element.parentFrameId,
    };
  }) };
}

export function fitFrameToContent(page: PublisherPage, frameId: string): PublisherPage {
  const frame = page.elements.find((element) => element.id === frameId && element.isFrame);
  if (!frame) return page;
  const children = page.elements.filter((element) => element.parentFrameId === frameId && !element.hidden);
  if (!children.length) return page;
  const padding = Math.max(0, frame.framePadding ?? 0);
  const left = Math.min(...children.map((element) => element.x));
  const top = Math.min(...children.map((element) => element.y));
  const right = Math.max(...children.map((element) => element.x + element.width));
  const bottom = Math.max(...children.map((element) => element.y + element.height));
  return updateFrameSettings(page, frameId, { x: left - padding, y: top - padding, width: right - left + padding * 2, height: bottom - top + padding * 2, frameFitMode: "fit-content" });
}

export function fitContentToFrame(page: PublisherPage, frameId: string, preserveAspect = true): PublisherPage {
  const frame = page.elements.find((element) => element.id === frameId && element.isFrame);
  if (!frame) return page;
  const children = page.elements.filter((element) => element.parentFrameId === frameId && !element.locked);
  if (!children.length) return page;
  const padding = Math.max(0, frame.framePadding ?? 0);
  const inner = { x: frame.x + padding, y: frame.y + padding, width: Math.max(1, frame.width - padding * 2), height: Math.max(1, frame.height - padding * 2) };
  const left = Math.min(...children.map((element) => element.x));
  const top = Math.min(...children.map((element) => element.y));
  const right = Math.max(...children.map((element) => element.x + element.width));
  const bottom = Math.max(...children.map((element) => element.y + element.height));
  const contentWidth = Math.max(1, right - left);
  const contentHeight = Math.max(1, bottom - top);
  const scaleX = inner.width / contentWidth;
  const scaleY = inner.height / contentHeight;
  const sx = preserveAspect ? Math.min(scaleX, scaleY) : scaleX;
  const sy = preserveAspect ? Math.min(scaleX, scaleY) : scaleY;
  const usedWidth = contentWidth * sx;
  const usedHeight = contentHeight * sy;
  const originX = inner.x + (inner.width - usedWidth) / 2;
  const originY = inner.y + (inner.height - usedHeight) / 2;
  return {
    ...page,
    elements: page.elements.map((element) => element.id === frameId ? { ...element, frameFitMode: "fit-frame" } : element.parentFrameId === frameId && !element.locked ? {
      ...element,
      x: originX + (element.x - left) * sx,
      y: originY + (element.y - top) * sy,
      width: Math.max(1, element.width * sx),
      height: Math.max(1, element.height * sy),
    } : element),
  };
}

export function moveFrameWithChildren(page: PublisherPage, frameId: string, x: number, y: number): PublisherPage {
  const frame = page.elements.find((element) => element.id === frameId && element.isFrame);
  if (!frame || frame.locked) return page;
  const dx = x - frame.x;
  const dy = y - frame.y;
  return { ...page, elements: page.elements.map((element) => element.id === frameId ? { ...element, x, y } : element.parentFrameId === frameId && !element.locked ? { ...element, x: element.x + dx, y: element.y + dy } : element) };
}

export function frameDiagnostics(page: PublisherPage) {
  const frames = page.elements.filter((element) => element.isFrame);
  const orphaned = page.elements.filter((element) => element.parentFrameId && !frames.some((frame) => frame.id === element.parentFrameId));
  const clipped = frames.reduce((count, frame) => count + page.elements.filter((child) => child.parentFrameId === frame.id && (child.x < frame.x || child.y < frame.y || child.x + child.width > frame.x + frame.width || child.y + child.height > frame.y + frame.height)).length, 0);
  return { frames: frames.length, anchored: page.elements.filter((element) => element.anchorMode && element.anchorMode !== "none").length, orphaned: orphaned.length, overflow: clipped };
}
