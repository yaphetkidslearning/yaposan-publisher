import { Platform } from "react-native";

export type ImagePayload = { imageBase64: string; mimeType: "image/png" | "image/jpeg" | "image/webp" };

function mimeFromUri(uri: string): ImagePayload["mimeType"] {
  const lower = uri.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg") || /\.jpe?g(?:[?#]|$)/.test(lower)) return "image/jpeg";
  if (lower.startsWith("data:image/webp") || /\.webp(?:[?#]|$)/.test(lower)) return "image/webp";
  return "image/png";
}

function parseDataUri(uri: string): ImagePayload | null {
  const match = uri.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase() as ImagePayload["mimeType"],
    imageBase64: match[2],
  };
}

async function blobToDataUri(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image data."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(blob);
  });
}

export async function imageUriToPayload(uri: string): Promise<ImagePayload> {
  const inline = parseDataUri(uri);
  if (inline) return inline;

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new Error(`Unable to read image (${response.status}).`);
    const dataUri = await blobToDataUri(await response.blob());
    const parsed = parseDataUri(dataUri);
    if (!parsed) throw new Error("Unsupported image type. Use PNG, JPEG, or WebP.");
    return parsed;
  }

  const FileSystem = await import("expo-file-system/legacy");
  const imageBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return { imageBase64, mimeType: mimeFromUri(uri) };
}

export function payloadToDataUri(imageBase64: string, mimeType: string) {
  return `data:${mimeType || "image/png"};base64,${imageBase64}`;
}
