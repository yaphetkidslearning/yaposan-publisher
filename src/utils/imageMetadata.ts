export type BasicImageMetadata = {
  name?: string;
  mimeType?: string;
  byteSize?: number;
  width?: number;
  height?: number;
  megapixels?: number;
  aspectRatio?: number;
  lastModified?: number;
};

export async function readBasicImageMetadata(file: File): Promise<BasicImageMetadata> {
  const uri = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const value = new Image(); value.onload = () => resolve(value); value.onerror = reject; value.src = uri;
    });
    const width = image.naturalWidth, height = image.naturalHeight;
    return { name: file.name, mimeType: file.type, byteSize: file.size, width, height, megapixels: width * height / 1_000_000, aspectRatio: width / Math.max(1, height), lastModified: file.lastModified };
  } finally { URL.revokeObjectURL(uri); }
}

export function linkedImageState(uri: string, lastModified?: number) {
  return { linkedImageUri: uri, linkedImageLastModified: lastModified ?? Date.now(), linkedImageStatus: "linked" as const };
}
