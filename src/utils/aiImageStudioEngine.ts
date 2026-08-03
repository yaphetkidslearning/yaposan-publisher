import type { AiImageJob, AiImageStudioProvider, AiImageTool, AiImageToolSettings } from "../types/aiImageStudio";

export const DEFAULT_AI_IMAGE_SETTINGS: AiImageToolSettings = {
  prompt: "Clean professional product photo",
  strength: 70,
  outputScale: 2,
  backgroundColor: "#ffffff",
  aspectRatio: "original",
  preserveShadow: true,
  refineEdges: true,
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createAiImageJob(assetId: string, inputUri: string, tool: AiImageTool, settings: AiImageToolSettings = DEFAULT_AI_IMAGE_SETTINGS): AiImageJob {
  return { id: uid("ai-job"), assetId, inputUri, tool, settings: { ...settings }, status: "queued", progress: 0, createdAt: Date.now() };
}

export function updateAiImageJob(jobs: AiImageJob[], jobId: string, patch: Partial<AiImageJob>): AiImageJob[] {
  return jobs.map((job) => job.id === jobId ? { ...job, ...patch } : job);
}

export function cancelAiImageJob(jobs: AiImageJob[], jobId: string): AiImageJob[] {
  return updateAiImageJob(jobs, jobId, { status: "cancelled", progress: 0, completedAt: Date.now() });
}

export function chooseAiImageProvider(providers: AiImageStudioProvider[], tool: AiImageTool): AiImageStudioProvider {
  const provider = providers.find((candidate) => candidate.supports(tool));
  if (!provider) throw new Error(`No configured image provider supports ${tool}.`);
  return provider;
}

export async function executeAiImageJob(job: AiImageJob, providers: AiImageStudioProvider[], onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<AiImageJob> {
  const provider = chooseAiImageProvider(providers, job.tool);
  try {
    const result = await provider.run({ tool: job.tool, imageUri: job.inputUri, settings: job.settings, signal, onProgress });
    return { ...job, providerId: result.providerId, outputUri: result.uri, status: "completed", progress: 100, completedAt: Date.now() };
  } catch (error) {
    if (signal?.aborted) return { ...job, providerId: provider.id, status: "cancelled", progress: 0, completedAt: Date.now() };
    return { ...job, providerId: provider.id, status: "failed", progress: 0, error: error instanceof Error ? error.message : String(error), completedAt: Date.now() };
  }
}

export class LocalPreviewImageProvider implements AiImageStudioProvider {
  id = "yaposan-local-preview";
  label = "Yaposan Local Preview";
  supports(_tool: AiImageTool) { return true; }
  async run(request: Parameters<AiImageStudioProvider["run"]>[0]) {
    for (const progress of [15, 35, 60, 82, 100]) {
      if (request.signal?.aborted) throw new Error("Cancelled");
      await new Promise((resolve) => setTimeout(resolve, 70));
      request.onProgress?.(progress);
    }
    return { uri: request.imageUri, providerId: this.id, metadata: { preview: true, tool: request.tool } };
  }
}

export class RemoveBgApiProvider implements AiImageStudioProvider {
  id = "remove-bg";
  label = "remove.bg";
  constructor(private readonly apiKey: string) {}
  supports(tool: AiImageTool) { return tool === "remove-background" || tool === "transparent-png" || tool === "white-background"; }
  async run(request: Parameters<AiImageStudioProvider["run"]>[0]) {
    if (!this.apiKey) throw new Error("Missing EXPO_PUBLIC_REMOVE_BG_API_KEY.");
    if (!request.imageUri.startsWith("http") && !request.imageUri.startsWith("data:")) throw new Error("remove.bg web integration requires an accessible image URL or data URI.");
    request.onProgress?.(10);
    const form = new FormData();
    if (request.imageUri.startsWith("http")) form.append("image_url", request.imageUri);
    else {
      const response = await fetch(request.imageUri);
      form.append("image_file", await response.blob(), "image.png");
    }
    form.append("size", "auto");
    if (request.tool === "white-background") form.append("bg_color", "ffffff");
    const response = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": this.apiKey }, body: form, signal: request.signal });
    if (!response.ok) throw new Error(`remove.bg failed (${response.status}).`);
    request.onProgress?.(85);
    const blob = await response.blob();
    const uri = typeof URL !== "undefined" ? URL.createObjectURL(blob) : request.imageUri;
    request.onProgress?.(100);
    return { uri, providerId: this.id };
  }
}
