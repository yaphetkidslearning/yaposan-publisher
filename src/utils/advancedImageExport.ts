export type ImageExportFormat = "png" | "jpeg" | "webp" | "tiff";
export type ImageExportPreset = { id: string; label: string; format: ImageExportFormat; dpi: number; quality: number; colorSpace: "sRGB" | "display-p3" | "cmyk-preview" };
export const IMAGE_EXPORT_PRESETS: ImageExportPreset[] = [
  { id: "screen-png", label: "Screen PNG", format: "png", dpi: 96, quality: 1, colorSpace: "sRGB" },
  { id: "web-jpeg", label: "Web JPEG", format: "jpeg", dpi: 96, quality: .86, colorSpace: "sRGB" },
  { id: "print-150", label: "Print 150 DPI", format: "jpeg", dpi: 150, quality: .94, colorSpace: "sRGB" },
  { id: "print-300", label: "Print 300 DPI", format: "png", dpi: 300, quality: 1, colorSpace: "cmyk-preview" },
  { id: "print-600", label: "Print 600 DPI", format: "png", dpi: 600, quality: 1, colorSpace: "cmyk-preview" },
];
export function exportScaleForDpi(dpi: number, documentDpi = 96) { return Math.max(.25, Math.min(8, dpi / documentDpi)); }
