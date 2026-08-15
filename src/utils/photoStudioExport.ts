import { Platform } from "react-native";
import type { PhotoStudioAsset } from "../types/photoStudio";

function safeName(name: string) {
  const base = (name || "yaposan-photo").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  return base || "yaposan-photo";
}

function mimeFromUri(uri: string) {
  if (uri.startsWith("data:")) return uri.slice(5, uri.indexOf(";")) || "image/png";
  if (/\.jpe?g(?:\?|$)/i.test(uri)) return "image/jpeg";
  if (/\.webp(?:\?|$)/i.test(uri)) return "image/webp";
  return "image/png";
}

function extensionForMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

export async function exportPhotoStudioAsset(asset: PhotoStudioAsset): Promise<string> {
  const mime = mimeFromUri(asset.uri);
  const filename = `${safeName(asset.name)}-${asset.backgroundMode ?? "edited"}.${extensionForMime(mime)}`;

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error(`Could not read edited image (${response.status}).`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  const [FileSystem, Sharing] = await Promise.all([import("expo-file-system/legacy"), import("expo-sharing")]);
  const destination = `${FileSystem.cacheDirectory ?? ""}${filename}`;
  if (asset.uri.startsWith("data:")) {
    const match = asset.uri.match(/^data:([^;,]+);base64,(.*)$/s);
    if (!match) throw new Error("Unsupported image data URI.");
    await FileSystem.writeAsStringAsync(destination, match[2], { encoding: FileSystem.EncodingType.Base64 });
  } else {
    const result = await FileSystem.downloadAsync(asset.uri, destination);
    if (result.status < 200 || result.status >= 300) throw new Error(`Could not download edited image (${result.status}).`);
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(destination, { mimeType: mime, dialogTitle: `Export ${filename}` });
  return destination;
}
