import type { PublisherElement } from "../types/publisher";

export type ShapeStylePreset = {
  id: string;
  name: string;
  updates: Partial<PublisherElement> & Record<string, unknown>;
};

export const SHAPE_STYLE_PRESETS: ShapeStylePreset[] = [
  { id: "flat", name: "Flat", updates: { shadowEnabled: false, glowEnabled: false, borderWidth: 0 } as any },
  { id: "outline", name: "Outline", updates: { fillColor: "transparent", borderWidth: 3, lineStyle: "solid" } as any },
  { id: "pastel", name: "Pastel", updates: { fillColor: "#DDD6FE", borderColor: "#8B5CF6", borderWidth: 2 } as any },
  { id: "glass", name: "Glass", updates: { fillColor: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.8)", borderWidth: 2, shadowEnabled: true } as any },
  { id: "neon", name: "Neon", updates: { fillColor: "#111827", borderColor: "#22D3EE", borderWidth: 3, glowEnabled: true, glowColor: "#22D3EE", glowRadius: 16 } as any },
  { id: "office", name: "Office", updates: { fillColor: "#2563EB", borderColor: "#1E3A8A", borderWidth: 1, shadowEnabled: true } as any },
  { id: "soft-3d", name: "Soft 3D", updates: { fillColor: "#14B8A6", borderColor: "#0F766E", borderWidth: 2, shadowEnabled: true, bevel: 8 } as any },
];
