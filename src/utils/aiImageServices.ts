export type AiImageOperation = "expand" | "remove-object" | "relight" | "recolor" | "replace-sky" | "generate-shadow" | "upscale" | "enhance-face";
export type AiImageRequest = { operation: AiImageOperation; imageUri: string; maskUri?: string; prompt?: string; strength?: number; outputScale?: number };
export type AiImageResult = { uri: string; provider: string; operation: AiImageOperation; createdAt: number };

export interface AiImageProvider {
  id: string;
  supports(operation: AiImageOperation): boolean;
  run(request: AiImageRequest): Promise<AiImageResult>;
}

export class MissingAiImageProvider implements AiImageProvider {
  id = "unconfigured";
  supports() { return false; }
  async run(request: AiImageRequest): Promise<AiImageResult> {
    throw new Error(`No AI provider is configured for ${request.operation}. Add a provider/API key before using this tool.`);
  }
}

export async function runAiImageOperation(provider: AiImageProvider, request: AiImageRequest): Promise<AiImageResult> {
  if (!provider.supports(request.operation)) throw new Error(`${provider.id} does not support ${request.operation}.`);
  return provider.run(request);
}
