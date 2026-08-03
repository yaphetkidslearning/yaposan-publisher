export type WebImageExportSettings = {
  format: "png" | "jpeg" | "webp";
  quality: number;
  scale: number;
};

export function clampExportQuality(value: number | undefined) {
  return Math.max(0.1, Math.min(1, value ?? 0.95));
}

export async function resampleWebDataUri(
  dataUri: string,
  settings: WebImageExportSettings,
): Promise<string> {
  if (typeof document === "undefined") return dataUri;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const node = new window.Image();
    node.onload = () => resolve(node);
    node.onerror = () => reject(new Error("Unable to prepare export."));
    node.src = dataUri;
  });
  const scale = Math.max(0.25, Math.min(4, settings.scale));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return dataUri;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const mime = settings.format === "png" ? "image/png" : settings.format === "webp" ? "image/webp" : "image/jpeg";
  return canvas.toDataURL(mime, clampExportQuality(settings.quality));
}
