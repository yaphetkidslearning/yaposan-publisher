export type PrintWarning = { code: string; severity: "info" | "warning" | "error"; message: string };

export function effectiveDpi(pixelWidth: number, pixelHeight: number, placedWidthPx: number, placedHeightPx: number, documentDpi = 96): number {
  const inchesW = placedWidthPx / documentDpi;
  const inchesH = placedHeightPx / documentDpi;
  return Math.floor(Math.min(pixelWidth / Math.max(inchesW, 0.01), pixelHeight / Math.max(inchesH, 0.01)));
}

export function preflightImage(options: { pixelWidth?: number; pixelHeight?: number; placedWidth: number; placedHeight: number; targetDpi?: number; colorSpace?: string; hasBleed?: boolean; opacity?: number }): PrintWarning[] {
  const warnings: PrintWarning[] = [];
  const target = options.targetDpi ?? 300;
  if (options.pixelWidth && options.pixelHeight) {
    const dpi = effectiveDpi(options.pixelWidth, options.pixelHeight, options.placedWidth, options.placedHeight);
    if (dpi < target) warnings.push({ code: "LOW_DPI", severity: dpi < 150 ? "error" : "warning", message: `Image effective resolution is ${dpi} DPI; target is ${target} DPI.` });
  }
  if ((options.colorSpace ?? "sRGB").toUpperCase() !== "CMYK") warnings.push({ code: "RGB_IMAGE", severity: "info", message: "Image is RGB. Commercial printers may convert colors to CMYK." });
  if (!options.hasBleed) warnings.push({ code: "NO_BLEED", severity: "warning", message: "Image does not extend into the document bleed area." });
  if ((options.opacity ?? 1) < 1) warnings.push({ code: "TRANSPARENCY", severity: "info", message: "Transparency may be flattened during print export." });
  return warnings;
}
