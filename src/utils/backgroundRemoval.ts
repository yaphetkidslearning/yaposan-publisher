import { Platform } from "react-native";

export type BackgroundRemovalResult = { uri: string; provider: "yaposan-local-preview" };

/**
 * Open-source safety: provider API keys are never embedded in the frontend.
 * Hosted background removal must be invoked through an authenticated server route
 * or a user-connected provider. This fallback preserves the source image locally.
 */
export async function removeImageBackground(uri: string): Promise<BackgroundRemovalResult> {
  if (!uri) throw new Error("Select an image first.");
  if (Platform.OS === "web" && uri.startsWith("blob:")) return { uri, provider: "yaposan-local-preview" };
  return { uri, provider: "yaposan-local-preview" };
}
