export type AiImageTool =
  | "remove-background"
  | "white-background"
  | "transparent-png"
  | "magic-eraser"
  | "expand"
  | "relight"
  | "upscale"
  | "product-scene";

export type AiImageToolSettings = {
  prompt: string;
  strength: number;
  outputScale: 1 | 2 | 4;
  backgroundColor: string;
  aspectRatio: "original" | "1:1" | "4:5" | "16:9";
  preserveShadow: boolean;
  refineEdges: boolean;
};

export type AiImageJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AiImageJob = {
  id: string;
  assetId: string;
  inputUri: string;
  tool: AiImageTool;
  settings: AiImageToolSettings;
  status: AiImageJobStatus;
  progress: number;
  providerId?: string;
  outputUri?: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
};

export type AiImageProviderRequest = {
  tool: AiImageTool;
  imageUri: string;
  maskUri?: string;
  settings: AiImageToolSettings;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

export type AiImageProviderResult = {
  uri: string;
  providerId: string;
  metadata?: Record<string, string | number | boolean>;
};

export interface AiImageStudioProvider {
  id: string;
  label: string;
  supports(tool: AiImageTool): boolean;
  run(request: AiImageProviderRequest): Promise<AiImageProviderResult>;
}
