export type BackgroundRemovalConfig = {
  serviceUrl?: string;
  timeoutMs: number;
  maxImageBytes: number;
};

export type BackgroundRemovalRequest = {
  imageBase64: string;
  mimeType: string;
  background?: "transparent" | "white" | "custom";
  backgroundColor?: string;
  qualityMode?: "auto" | "fast" | "quality";
  preset?: "marketplace-product" | "pure-white-catalog" | "transparent-original" | "custom";
  paddingPercent?: number;
  squareCanvas?: boolean;
  preserveShadow?: boolean;
  categoryHint?: "auto" | "hard-goods" | "footwear" | "apparel" | "furniture" | "thin-structures" | "hair-fur" | "glass-transparent" | "jewelry" | "general-merchandise";
  outputFormat?: "png" | "webp" | "jpeg";
  normalizeLighting?: boolean;
  catalogTargetOccupancy?: number;
  catalogCanvasPx?: number;
  targetLuma?: number;
  targetRgb?: number[];
  strictWhite?: boolean;
  whiteAuditThreshold?: number;
};

export type BackgroundRemovalResult = {
  imageBase64: string;
  mimeType: "image/png" | "image/webp" | "image/jpeg";
  provider: "yaposan-self-hosted";
  perImageApiCostUsd: 0;
  qualityScore: number;
  qualityStatus: "pass" | "review";
  reviewReasons: string[];
  difficultyScore: number;
  usedModel: string;
  retried: boolean;
  candidateCount: number;
  modelAgreementIou: number;
  maskDiagnostics: Record<string, number>;
  engineVersion: string;
  category: string;
  subjectLane: "person" | "product" | "ambiguous";
  classificationMethod: string;
  visualConditions: string[];
  usedStrategy: string;
  foregroundGeometry: Record<string, number>;
  outputForegroundGeometry: Record<string, number>;
  highResolutionMode: string;
  duplicateHit: boolean;
  processingMs: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  strictWhite?: boolean;
  whiteBackgroundAudit?: { pass?: boolean; compliance?: number; exact_rgb?: number[]; nonwhite_background_pixels?: number };
  postExportWhiteAudit?: { pass?: boolean; certified?: boolean; compliance?: number; format?: string; reason?: string };
  whiteOnWhiteDetailForced?: boolean;
};


export type ProductPhotoAnalysisResult = {
  imageSha256: string; width: number; height: number; megapixels: number; difficultyScore: number;
  visualConditions: string[]; category: string; meanRgb: number[]; meanLuma: number; perImageApiCostUsd: 0;
};

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export function loadBackgroundRemovalConfig(env = process.env): BackgroundRemovalConfig {
  const timeout = Number(env.BACKGROUND_REMOVAL_TIMEOUT_MS ?? 300000);
  const maxBytes = Number(env.BACKGROUND_REMOVAL_MAX_IMAGE_BYTES ?? 50_000_000);
  return {
    serviceUrl: env.BACKGROUND_REMOVAL_URL?.trim() || undefined,
    timeoutMs: Number.isFinite(timeout) && timeout >= 1000 ? Math.min(timeout, 600000) : 300000,
    maxImageBytes: Number.isFinite(maxBytes) && maxBytes > 0 ? Math.min(maxBytes, 50_000_000) : 50_000_000,
  };
}

export function validateBackgroundRemovalRequest(body: BackgroundRemovalRequest, config: BackgroundRemovalConfig) {
  if (!ALLOWED_MIME.has(body.mimeType)) throw new Error("UNSUPPORTED_IMAGE_TYPE");
  if (!body.imageBase64 || typeof body.imageBase64 !== "string") throw new Error("IMAGE_REQUIRED");
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(body.imageBase64)) throw new Error("INVALID_IMAGE_DATA");
  const estimatedBytes = Math.floor(body.imageBase64.replace(/\s/g, "").length * 0.75);
  if (estimatedBytes > config.maxImageBytes) throw new Error("IMAGE_TOO_LARGE");
  if (body.background && !["transparent", "white", "custom"].includes(body.background)) throw new Error("INVALID_BACKGROUND_MODE");
  if (body.qualityMode && !["auto", "fast", "quality"].includes(body.qualityMode)) throw new Error("INVALID_QUALITY_MODE");
  if (body.paddingPercent != null && (!Number.isFinite(body.paddingPercent) || body.paddingPercent < 0 || body.paddingPercent > 30)) throw new Error("INVALID_PADDING");
  if (body.backgroundColor && !/^#?[0-9A-Fa-f]{6}$/.test(body.backgroundColor)) throw new Error("INVALID_BACKGROUND_COLOR");
  if (body.outputFormat && !["png", "webp", "jpeg"].includes(body.outputFormat)) throw new Error("INVALID_OUTPUT_FORMAT");
  if (body.catalogTargetOccupancy != null && (!Number.isFinite(body.catalogTargetOccupancy) || body.catalogTargetOccupancy < 0.45 || body.catalogTargetOccupancy > 0.92)) throw new Error("INVALID_CATALOG_OCCUPANCY");
  if (body.targetLuma != null && (!Number.isFinite(body.targetLuma) || body.targetLuma < 0 || body.targetLuma > 1)) throw new Error("INVALID_TARGET_LUMA");
  if (body.targetRgb && (body.targetRgb.length !== 3 || body.targetRgb.some(v => !Number.isFinite(v) || v < 0 || v > 1))) throw new Error("INVALID_TARGET_RGB");
}

export async function runSelfHostedProductPhotoAnalysis(
  body: Pick<BackgroundRemovalRequest, "imageBase64" | "mimeType" | "categoryHint">,
  config = loadBackgroundRemovalConfig(),
): Promise<ProductPhotoAnalysisResult> {
  validateBackgroundRemovalRequest({ imageBase64: body.imageBase64, mimeType: body.mimeType }, config);
  if (!config.serviceUrl) throw new Error("BACKGROUND_REMOVAL_NOT_CONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(config.timeoutMs, 60000));
  try {
    const response = await fetch(`${config.serviceUrl.replace(/\/$/, "")}/analyze-photo`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ image_base64: body.imageBase64, mime_type: body.mimeType, category_hint: body.categoryHint ?? "auto" }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BACKGROUND_ANALYSIS_SERVICE_${response.status}`);
    const data = await response.json() as Record<string, unknown>;
    return {
      imageSha256: String(data.image_sha256 ?? ""), width: Number(data.width ?? 0), height: Number(data.height ?? 0),
      megapixels: Number(data.megapixels ?? 0), difficultyScore: Number(data.difficulty_score ?? 0),
      visualConditions: Array.isArray(data.visual_conditions) ? data.visual_conditions.map(String) : [], category: String(data.category ?? "general-merchandise"),
      meanRgb: Array.isArray(data.mean_rgb) ? data.mean_rgb.map(Number) : [0.5,0.5,0.5], meanLuma: Number(data.mean_luma ?? 0.5), perImageApiCostUsd: 0,
    };
  } catch (error) { if (controller.signal.aborted) throw new Error("BACKGROUND_ANALYSIS_TIMEOUT"); throw error; } finally { clearTimeout(timer); }
}

export async function runSelfHostedBackgroundRemoval(
  body: BackgroundRemovalRequest,
  config = loadBackgroundRemovalConfig(),
): Promise<BackgroundRemovalResult> {
  validateBackgroundRemovalRequest(body, config);
  if (!config.serviceUrl) throw new Error("BACKGROUND_REMOVAL_NOT_CONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.serviceUrl.replace(/\/$/, "")}/remove-background`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image_base64: body.imageBase64,
        mime_type: body.mimeType,
        background: body.background ?? "transparent",
        background_color: body.backgroundColor,
        quality_mode: body.qualityMode ?? "auto",
        preset: body.preset ?? "marketplace-product",
        padding_percent: body.paddingPercent ?? 10,
        square_canvas: body.squareCanvas ?? true,
        preserve_shadow: body.preserveShadow ?? true,
        category_hint: body.categoryHint ?? "auto",
        output_format: body.outputFormat ?? "png",
        normalize_lighting: body.normalizeLighting ?? false,
        catalog_target_occupancy: body.catalogTargetOccupancy ?? 0.78,
        catalog_canvas_px: body.catalogCanvasPx,
        target_luma: body.targetLuma,
        target_rgb: body.targetRgb,
        strict_white: body.strictWhite ?? false,
        white_audit_threshold: body.whiteAuditThreshold ?? 1,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BACKGROUND_REMOVAL_SERVICE_${response.status}`);
    const data = await response.json() as Record<string, unknown>;
    if (!data.image_base64) throw new Error("BACKGROUND_REMOVAL_EMPTY_RESULT");
    return {
      imageBase64: String(data.image_base64),
      mimeType: data.mime_type === "image/webp" ? "image/webp" : data.mime_type === "image/jpeg" ? "image/jpeg" : "image/png",
      provider: "yaposan-self-hosted",
      perImageApiCostUsd: 0,
      qualityScore: Number(data.quality_score ?? 0),
      qualityStatus: data.quality_status === "pass" ? "pass" : "review",
      reviewReasons: Array.isArray(data.review_reasons) ? data.review_reasons.map(String) : [],
      difficultyScore: Number(data.difficulty_score ?? 0),
      usedModel: String(data.used_model ?? "unknown"),
      retried: Boolean(data.retried),
      candidateCount: Number(data.candidate_count ?? 1),
      modelAgreementIou: Number(data.model_agreement_iou ?? 1),
      maskDiagnostics: data.mask_diagnostics && typeof data.mask_diagnostics === "object" ? Object.fromEntries(Object.entries(data.mask_diagnostics as Record<string, unknown>).map(([k,v]) => [k, Number(v)])) : {},
      engineVersion: String(data.engine_version ?? "unknown"),
      category: String(data.category ?? "general-merchandise"),
      subjectLane: data.subject_lane === "person" ? "person" : data.subject_lane === "product" ? "product" : "ambiguous",
      classificationMethod: String(data.classification_method ?? "unknown"),
      visualConditions: Array.isArray(data.visual_conditions) ? data.visual_conditions.map(String) : [],
      usedStrategy: String(data.used_strategy ?? "unknown"),
      foregroundGeometry: data.foreground_geometry && typeof data.foreground_geometry === "object" ? Object.fromEntries(Object.entries(data.foreground_geometry as Record<string, unknown>).map(([k,v]) => [k, Number(v)])) : {},
      outputForegroundGeometry: data.output_foreground_geometry && typeof data.output_foreground_geometry === "object" ? Object.fromEntries(Object.entries(data.output_foreground_geometry as Record<string, unknown>).map(([k,v]) => [k, Number(v)])) : {},
      highResolutionMode: String(data.high_resolution_mode ?? "standard"),
      duplicateHit: Boolean(data.duplicate_hit),
      processingMs: Number(data.processing_ms ?? 0),
      originalWidth: Number(data.original_width ?? 0),
      originalHeight: Number(data.original_height ?? 0),
      outputWidth: Number(data.output_width ?? 0),
      outputHeight: Number(data.output_height ?? 0),
      strictWhite: Boolean(data.strict_white),
      whiteBackgroundAudit: data.white_background_audit && typeof data.white_background_audit === "object" ? data.white_background_audit as BackgroundRemovalResult["whiteBackgroundAudit"] : undefined,
      postExportWhiteAudit: data.post_export_white_audit && typeof data.post_export_white_audit === "object" ? data.post_export_white_audit as BackgroundRemovalResult["postExportWhiteAudit"] : undefined,
      whiteOnWhiteDetailForced: Boolean(data.white_on_white_detail_forced),
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("BACKGROUND_REMOVAL_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
