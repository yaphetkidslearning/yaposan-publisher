export type ImageFilterPreset = {
  id: string;
  name: string;
  icon: string;
  updates: Record<string, number | string>;
};

export const IMAGE_FILTER_PRESETS: ImageFilterPreset[] = [
  { id: "original", name: "Original", icon: "image-outline", updates: { brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0, blur: 0, grayscale: 0, sepia: 0 } },
  { id: "bw", name: "B&W", icon: "contrast-outline", updates: { grayscale: 100, saturation: 0, contrast: 112 } },
  { id: "sepia", name: "Sepia", icon: "cafe-outline", updates: { sepia: 75, saturation: 78, warmth: 18 } },
  { id: "vintage", name: "Vintage", icon: "film-outline", updates: { sepia: 36, saturation: 72, contrast: 92, warmth: 15 } },
  { id: "cool", name: "Cool", icon: "snow-outline", updates: { warmth: -22, saturation: 108, contrast: 104 } },
  { id: "warm", name: "Warm", icon: "sunny-outline", updates: { warmth: 24, saturation: 110, contrast: 102 } },
  { id: "contrast", name: "High Contrast", icon: "aperture-outline", updates: { contrast: 140, saturation: 112 } },
  { id: "soft", name: "Soft", icon: "water-outline", updates: { contrast: 88, brightness: 106, blur: 0.7 } },
  { id: "fade", name: "Fade", icon: "cloud-outline", updates: { contrast: 82, saturation: 72, brightness: 108 } },
];

export const IMAGE_MASKS = ["rectangle", "rounded", "circle", "oval", "star", "heart", "arch", "polaroid"] as const;
export type ImageMask = typeof IMAGE_MASKS[number];

export const IMAGE_ASPECT_RATIOS = [
  { id: "free", label: "Free", ratio: 0 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "3:4", label: "3:4", ratio: 3 / 4 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
] as const;
