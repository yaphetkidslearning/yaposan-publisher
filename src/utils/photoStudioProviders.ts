import type { AiImageStudioProvider, AiImageTool } from "../types/aiImageStudio";
import { imageUriToPayload, payloadToDataUri } from "./imageTransport";

type AuthorizedFetch = (path: string, init?: RequestInit) => Promise<Response>;

const BACKGROUND_TOOLS = new Set<AiImageTool>(["remove-background", "white-background", "transparent-png", "custom-background"]);
const MEDIA_TOOL_OPERATION: Partial<Record<AiImageTool, string>> = {
  "magic-eraser": "remove-object",
  "expand": "outpaint",
  "relight": "relight",
  "upscale": "upscale",
  "product-scene": "product-scene",
};

async function errorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json() as any;
    return String(data?.error?.message ?? data?.detail ?? `Request failed (${response.status}).`);
  } catch {
    return `Request failed (${response.status}).`;
  }
}

function extractAssetUrl(data: any): string | undefined {
  const candidates = [
    data?.assetUrl, data?.url, data?.uri, data?.output_url, data?.outputUrl,
    data?.output?.assetUrl, data?.output?.url, data?.output?.uri,
    data?.output?.data?.[0]?.url, data?.data?.[0]?.url,
  ];
  return candidates.find((value) => typeof value === "string" && value.length > 0);
}

export class YaposanPhotoStudioProvider implements AiImageStudioProvider {
  id = "yaposan-photo-runtime";
  label = "Yaposan Photo Runtime";
  constructor(private readonly authorizedFetch: AuthorizedFetch) {}

  supports(tool: AiImageTool) {
    return BACKGROUND_TOOLS.has(tool) || Boolean(MEDIA_TOOL_OPERATION[tool]);
  }

  async run(request: Parameters<AiImageStudioProvider["run"]>[0]) {
    if (BACKGROUND_TOOLS.has(request.tool)) return this.runBackground(request);
    return this.runMedia(request);
  }

  private async runBackground(request: Parameters<AiImageStudioProvider["run"]>[0]) {
    request.onProgress?.(8);
    const payload = await imageUriToPayload(request.imageUri);
    request.onProgress?.(20);
    const background = request.tool === "white-background"
      ? "white"
      : request.tool === "custom-background"
        ? "custom"
        : "transparent";
    const response = await this.authorizedFetch("/api/v1/image/background-remove", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: payload.imageBase64,
        mimeType: payload.mimeType,
        background,
        backgroundColor: request.settings.backgroundColor,
        qualityMode: "quality",
        preset: background === "transparent" ? "transparent-original" : background === "white" ? "pure-white-catalog" : "custom",
        paddingPercent: 0,
        squareCanvas: false,
        preserveShadow: request.settings.preserveShadow,
        categoryHint: "auto",
        outputFormat: "png",
        strictWhite: background === "white",
        whiteAuditThreshold: 1,
      }),
      signal: request.signal,
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    request.onProgress?.(90);
    const result = await response.json() as any;
    if (!result?.imageBase64) throw new Error("Background-removal service returned no image.");
    request.onProgress?.(100);
    return {
      uri: payloadToDataUri(String(result.imageBase64), String(result.mimeType ?? "image/png")),
      providerId: this.id,
      metadata: {
        qualityStatus: result.qualityStatus,
        qualityScore: result.qualityScore,
        usedModel: result.usedModel,
        reviewReasonCount: Array.isArray(result.reviewReasons) ? result.reviewReasons.length : 0,
        background,
      },
    };
  }

  private async runMedia(request: Parameters<AiImageStudioProvider["run"]>[0]) {
    const operation = MEDIA_TOOL_OPERATION[request.tool];
    if (!operation) throw new Error(`No implementation is available for ${request.tool}.`);
    request.onProgress?.(5);
    const payload = await imageUriToPayload(request.imageUri);
    const maskPayload = request.maskUri ? await imageUriToPayload(request.maskUri) : undefined;
    request.onProgress?.(15);
    if (request.tool === "magic-eraser" && !maskPayload) throw new Error("Magic Eraser needs a mask. Import or create a black/white mask before running the tool.");
    const response = await this.authorizedFetch("/api/v1/ai/media/generate", {
      method: "POST",
      body: JSON.stringify({
        kind: "image",
        prompt: request.settings.prompt || `${operation} this image professionally`,
        options: {
          operation,
          imageBase64: payload.imageBase64,
          mimeType: payload.mimeType,
          maskBase64: maskPayload?.imageBase64,
          maskMimeType: maskPayload?.mimeType,
          strength: request.settings.strength,
          outputScale: request.settings.outputScale,
          aspectRatio: request.settings.aspectRatio,
          relightDirection: request.settings.relightDirection,
          scenePreset: request.settings.scenePreset,
          preserveShadow: request.settings.preserveShadow,
          refineEdges: request.settings.refineEdges,
        },
      }),
      signal: request.signal,
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    let result = await response.json() as any;
    let assetUrl = extractAssetUrl(result);
    let jobId = typeof result?.jobId === "string" ? result.jobId : undefined;

    if (!assetUrl && jobId) {
      for (let attempt = 0; attempt < 20 && !request.signal?.aborted; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        request.onProgress?.(20 + Math.min(70, attempt * 3.5));
        const status = await this.authorizedFetch(`/api/v1/ai/media/image/jobs/${encodeURIComponent(jobId)}`, { signal: request.signal });
        if (!status.ok) throw new Error(await errorMessage(status));
        result = await status.json();
        assetUrl = extractAssetUrl(result);
        if (assetUrl) break;
      }
    }

    if (!assetUrl) throw new Error("Image provider accepted the job but did not return a completed image within 30 seconds.");
    request.onProgress?.(100);
    return { uri: assetUrl, providerId: this.id, metadata: { operation, jobId } };
  }
}
