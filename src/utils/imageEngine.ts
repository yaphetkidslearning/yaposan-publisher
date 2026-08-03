export type ImageAdjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  warmth: number;
  tint: number;
  sharpness: number;
  blur: number;
  grayscale: number;
  sepia: number;
};

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  brightness: 100, contrast: 100, saturation: 100, exposure: 0,
  highlights: 0, shadows: 0, warmth: 0, tint: 0, sharpness: 0,
  blur: 0, grayscale: 0, sepia: 0,
};

export function normalizeImageAdjustments(value: Partial<ImageAdjustments> | undefined): ImageAdjustments {
  return { ...DEFAULT_IMAGE_ADJUSTMENTS, ...(value ?? {}) };
}

export function buildWebImageFilter(value: Partial<ImageAdjustments> | undefined) {
  const a = normalizeImageAdjustments(value);
  const exposedBrightness = Math.max(0, a.brightness + a.exposure * 1.25 + a.shadows * 0.15 + a.highlights * 0.08);
  const warmthSepia = Math.max(0, a.sepia + Math.max(0, a.warmth) * 0.35);
  const hue = a.tint + Math.min(0, a.warmth) * 0.7;
  return [
    `brightness(${exposedBrightness}%)`,
    `contrast(${Math.max(0, a.contrast)}%)`,
    `saturate(${Math.max(0, a.saturation)}%)`,
    `grayscale(${Math.max(0, a.grayscale)}%)`,
    `sepia(${Math.max(0, warmthSepia)}%)`,
    `hue-rotate(${hue}deg)`,
    `blur(${Math.max(0, a.blur)}px)`,
  ].join(" ");
}

export function maskStyle(mask: string | undefined, radius = 0): Record<string, unknown> {
  switch (mask) {
    case "circle": return { borderRadius: 9999 };
    case "oval": return { borderRadius: "50%" };
    case "rounded": return { borderRadius: Math.max(radius, 24) };
    case "arch": return { borderTopLeftRadius: 9999, borderTopRightRadius: 9999 };
    case "polaroid": return { borderRadius: 3, borderWidth: 12, borderBottomWidth: 34, borderColor: "#FFFFFF" };
    default: return { borderRadius: radius };
  }
}

export function resetImageEdits() {
  return {
    imageFit: "cover", imageMask: "rectangle", cropX: 0, cropY: 0,
    cropScale: 1, cropAspect: "free", flipHorizontal: false, flipVertical: false,
    imageAdjustments: { ...DEFAULT_IMAGE_ADJUSTMENTS }, imageFilter: "original",
    borderWidth: 0, borderRadius: 0, shadowEnabled: false, glowEnabled: false,
  };
}


export type ImageExportOptions = {
  format: "png" | "jpeg" | "webp";
  quality: number;
  scale: number;
  preserveTransparency: boolean;
};

export const DEFAULT_IMAGE_EXPORT_OPTIONS: ImageExportOptions = {
  format: "png", quality: 0.95, scale: 1, preserveTransparency: true,
};

export function clampImageEdits(value: Partial<ImageAdjustments>): ImageAdjustments {
  const a = normalizeImageAdjustments(value);
  return {
    brightness: Math.max(0, Math.min(200, a.brightness)),
    contrast: Math.max(0, Math.min(200, a.contrast)),
    saturation: Math.max(0, Math.min(200, a.saturation)),
    exposure: Math.max(-100, Math.min(100, a.exposure)),
    highlights: Math.max(-100, Math.min(100, a.highlights)),
    shadows: Math.max(-100, Math.min(100, a.shadows)),
    warmth: Math.max(-100, Math.min(100, a.warmth)),
    tint: Math.max(-100, Math.min(100, a.tint)),
    sharpness: Math.max(0, Math.min(100, a.sharpness)),
    blur: Math.max(0, Math.min(30, a.blur)),
    grayscale: Math.max(0, Math.min(100, a.grayscale)),
    sepia: Math.max(0, Math.min(100, a.sepia)),
  };
}

export function imageMaskWebStyle(mask: string | undefined): Record<string, unknown> {
  if (mask === "star") return { clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 100%,50% 74%,21% 100%,32% 57%,2% 35%,39% 35%)" };
  if (mask === "heart") return { clipPath: "polygon(50% 92%,8% 50%,4% 30%,14% 12%,31% 7%,50% 23%,69% 7%,86% 12%,96% 30%,92% 50%)" };
  return {};
}

export function cropTransform(cropX = 0, cropY = 0, cropScale = 1) {
  return [
    { translateX: cropX },
    { translateY: cropY },
    { scale: Math.max(0.1, Math.min(5, cropScale)) },
  ];
}

export function aspectRatioValue(aspect: string | undefined): number | null {
  const preset = IMAGE_ASPECT_RATIOS_INTERNAL[aspect ?? "free"];
  return preset || null;
}

const IMAGE_ASPECT_RATIOS_INTERNAL: Record<string, number> = {
  "1:1": 1, "4:3": 4/3, "3:4": 3/4, "16:9": 16/9, "9:16": 9/16,
};

export async function readImageFileAsDataUri(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function getWebImageDimensions(uri: string): Promise<{width:number;height:number}> {
  return await new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = uri;
  });
}
