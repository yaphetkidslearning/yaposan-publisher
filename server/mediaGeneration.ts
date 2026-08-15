import { fetchJsonLimited } from "./aiNetworkSecurity.ts";

export type MediaKind = "image" | "video" | "audio";
export type MediaGenerationRequest = { kind: MediaKind; prompt: string; model?: string; options?: Record<string, unknown> };
export type MediaGenerationResult = { kind: MediaKind; provider: string; model?: string; status: "ready" | "queued"; assetUrl?: string; jobId?: string; output: unknown };

function configFor(kind: MediaKind) {
  const prefix = `AI_${kind.toUpperCase()}_PROVIDER`;
  return { endpoint: process.env[`${prefix}_URL`] ?? "", apiKey: process.env[`${prefix}_API_KEY`] ?? "", model: process.env[`${prefix}_MODEL`] ?? "", provider: process.env[`${prefix}_NAME`] ?? kind };
}

function authHeaders(apiKey: string) {
  return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
}

function extractAssetUrl(data: unknown): string | undefined {
  const record = (data ?? {}) as Record<string, any>;
  return [record.assetUrl, record.url, record.uri, record.output_url, record.outputUrl, record.result?.url, record.output?.url, record.output?.uri, Array.isArray(record.data) && record.data[0]?.url]
    .find((value): value is string => typeof value === "string" && value.length > 0);
}

function extractJobId(data: unknown): string | undefined {
  const record = (data ?? {}) as Record<string, any>;
  return [record.id, record.job_id, record.jobId, record.output?.id]
    .find((value): value is string => typeof value === "string" && value.length > 0);
}


export function mediaProviderCapabilities() {
  const one = (kind: MediaKind) => {
    const cfg = configFor(kind);
    const prefix = `AI_${kind.toUpperCase()}_PROVIDER`;
    return {
      kind,
      configured: Boolean(cfg.endpoint),
      provider: cfg.provider,
      model: cfg.model || undefined,
      statusPollingConfigured: Boolean(process.env[`${prefix}_STATUS_URL`]),
      cancellationConfigured: Boolean(process.env[`${prefix}_CANCEL_URL`]),
    };
  };
  return { image: one("image"), video: one("video"), audio: one("audio") };
}

export async function generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
  const cfg = configFor(request.kind);
  if (!cfg.endpoint) throw new Error(`AI_${request.kind.toUpperCase()}_PROVIDER_NOT_CONFIGURED`);
  const { response, data } = await fetchJsonLimited(cfg.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(cfg.apiKey) },
    body: JSON.stringify({ ...(request.options ?? {}), prompt: request.prompt, model: request.model ?? (cfg.model || undefined) }),
  }, { provider: cfg.provider });
  if (!response.ok) throw new Error(`AI_${request.kind.toUpperCase()}_PROVIDER_${response.status}`);
  const url = extractAssetUrl(data);
  const jobId = extractJobId(data);
  if (!url && !jobId) throw new Error(`AI_${request.kind.toUpperCase()}_PROVIDER_EMPTY_RESULT`);
  return { kind: request.kind, provider: cfg.provider, model: request.model ?? (cfg.model || undefined), status: url ? "ready" : "queued", assetUrl: url, jobId, output: data };
}

function jobEndpoint(kind: MediaKind, action: "status" | "cancel", jobId: string) {
  const prefix = `AI_${kind.toUpperCase()}_PROVIDER`;
  const template = process.env[`${prefix}_${action.toUpperCase()}_URL`] ?? "";
  if (!template) throw new Error(`AI_${kind.toUpperCase()}_PROVIDER_${action.toUpperCase()}_NOT_CONFIGURED`);
  return template.replace("{id}", encodeURIComponent(jobId));
}

export async function getMediaJob(kind: MediaKind, jobId: string) {
  const cfg = configFor(kind); const endpoint = jobEndpoint(kind, "status", jobId);
  const { response, data } = await fetchJsonLimited(endpoint, { method:"GET", headers:{ ...authHeaders(cfg.apiKey) } }, { provider:cfg.provider });
  if(!response.ok) throw new Error(`AI_${kind.toUpperCase()}_STATUS_${response.status}`);
  const assetUrl = extractAssetUrl(data);
  return { kind, provider:cfg.provider, jobId, status: assetUrl ? "ready" : "queued", assetUrl, output:data };
}

export async function cancelMediaJob(kind: MediaKind, jobId: string) {
  const cfg = configFor(kind); const endpoint = jobEndpoint(kind, "cancel", jobId);
  const { response, data } = await fetchJsonLimited(endpoint, { method:"POST", headers:{ "content-type":"application/json", ...authHeaders(cfg.apiKey) }, body:"{}" }, { provider:cfg.provider });
  if(!response.ok) throw new Error(`AI_${kind.toUpperCase()}_CANCEL_${response.status}`);
  return { kind, provider:cfg.provider, jobId, cancelled:true, output:data };
}
