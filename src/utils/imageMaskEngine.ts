export type ImageMaskMode = "add" | "subtract" | "intersect";
export type ImageMaskPoint = { x: number; y: number; inX?: number; inY?: number; outX?: number; outY?: number };
export type EditableImageMask = {
  id: string;
  name: string;
  closed: boolean;
  inverted: boolean;
  feather: number;
  opacity: number;
  mode: ImageMaskMode;
  points: ImageMaskPoint[];
};

export function createImageMask(name = "Mask"): EditableImageMask {
  return { id: `mask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, closed: true, inverted: false, feather: 0, opacity: 1, mode: "add", points: [] };
}

export function normalizeMask(mask: EditableImageMask): EditableImageMask {
  return { ...mask, feather: Math.max(0, Math.min(100, mask.feather)), opacity: Math.max(0, Math.min(1, mask.opacity)), points: mask.points.map((p) => ({ ...p, x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) })) };
}

export function combineMasks(masks: EditableImageMask[]): EditableImageMask[] {
  return masks.map(normalizeMask);
}

export function maskToSvgPath(mask: EditableImageMask, width: number, height: number): string {
  if (!mask.points.length) return "";
  const [first, ...rest] = mask.points;
  let d = `M ${first.x * width} ${first.y * height}`;
  for (const p of rest) d += ` L ${p.x * width} ${p.y * height}`;
  if (mask.closed) d += " Z";
  return d;
}
