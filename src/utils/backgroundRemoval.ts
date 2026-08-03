import { Platform } from "react-native";

export type BackgroundRemovalResult = {
  uri: string;
  provider: "remove.bg";
};

function getApiKey() {
  return process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY?.trim() ?? "";
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Unable to read the selected image.");
  return await response.blob();
}

async function blobToDataUri(blob: Blob): Promise<string> {
  if (typeof FileReader !== "undefined") {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read processed image."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  const base64 = globalThis.btoa(binary);
  return `data:${blob.type || "image/png"};base64,${base64}`;
}

/**
 * Removes the real subject background through remove.bg.
 * Requires EXPO_PUBLIC_REMOVE_BG_API_KEY in the project environment.
 */
export async function removeImageBackground(uri: string): Promise<BackgroundRemovalResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Background removal needs EXPO_PUBLIC_REMOVE_BG_API_KEY. Add a remove.bg API key to your .env file, then restart Expo.",
    );
  }

  const source = await uriToBlob(uri);
  const form = new FormData();
  form.append("size", "auto");
  form.append("format", "png");
  form.append("image_file", source, "yaposan-image.png");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!response.ok) {
    let detail = "Background removal failed.";
    try {
      const body = await response.json();
      detail = body?.errors?.[0]?.title ?? body?.errors?.[0]?.detail ?? detail;
    } catch {
      detail = `${detail} (${response.status})`;
    }
    throw new Error(detail);
  }

  const output = await response.blob();
  const uriResult = Platform.OS === "web" ? URL.createObjectURL(output) : await blobToDataUri(output);
  return { uri: uriResult, provider: "remove.bg" };
}
