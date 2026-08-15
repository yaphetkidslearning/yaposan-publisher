import type { AiImageJob, AiImageStudioProvider, AiImageTool, AiImageToolSettings } from "../types/aiImageStudio";

export const DEFAULT_AI_IMAGE_SETTINGS: AiImageToolSettings = {
  prompt: "Clean professional product photo",
  strength: 70,
  outputScale: 2,
  backgroundColor: "#ffffff",
  aspectRatio: "original",
  preserveShadow: true,
  refineEdges: true,
  relightDirection: "soft",
  scenePreset: "studio",
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
    const result = await provider.run({ tool: job.tool, imageUri: job.inputUri, maskUri: job.maskUri, settings: job.settings, signal, onProgress });
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

export class HostedImageProviderUnavailable implements AiImageStudioProvider {
  id = "hosted-image-provider-unavailable";
  label = "Hosted AI (server configuration required)";
  supports(tool: AiImageTool) { return tool === "remove-background" || tool === "transparent-png" || tool === "white-background"; }
  async run(_request: Parameters<AiImageStudioProvider["run"]>[0]) {
    throw new Error("Hosted image AI is not configured. Provider credentials must stay on the server; use Yaposan Local or connect an AI provider from AI Access.");
  }
}
