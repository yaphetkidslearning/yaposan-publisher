export type ImageAdjustmentLayer = {
  id: string;
  name: string;
  enabled: boolean;
  opacity: number;
  kind: "brightness" | "contrast" | "hsl" | "curves" | "filter" | "vignette" | "blur";
  settings: Record<string, number | string | boolean | unknown[]>;
};

export function createAdjustmentLayer(kind: ImageAdjustmentLayer["kind"], settings: ImageAdjustmentLayer["settings"] = {}): ImageAdjustmentLayer {
  return { id: `adjustment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: kind.charAt(0).toUpperCase() + kind.slice(1), enabled: true, opacity: 1, kind, settings };
}

export function moveAdjustmentLayer(layers: ImageAdjustmentLayer[], id: string, direction: -1 | 1) {
  const next = [...layers]; const index = next.findIndex((layer) => layer.id === id); if (index < 0) return next;
  const target = Math.max(0, Math.min(next.length - 1, index + direction)); [next[index], next[target]] = [next[target], next[index]]; return next;
}
