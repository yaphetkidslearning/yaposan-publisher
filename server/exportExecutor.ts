import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseAdapter, JobRecord, ProjectRecord } from "./database.ts";
import type { ObjectStorage, StoredObject } from "./storage.ts";
import { buildExportManifest, type ExportRequest, type ProductionFormat } from "./productionExport.ts";

export type PublishedArtifact = StoredObject & { name: string; role: "primary" | "manifest" };
export type ExportExecutionResult = {
  manifest: ReturnType<typeof buildExportManifest>;
  artifacts: PublishedArtifact[];
  completedAt: string;
};

type RenderedArtifact = { name: string; contentType: string; body: Uint8Array };
export type ExternalRendererConfig = { ffmpegPath?: string; timeoutMs?: number };
const encoder = new TextEncoder();
const MAX_RASTER_PIXELS = 16_777_216;
const MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
const checksum = (body: Uint8Array) => createHash("sha256").update(body).digest("hex");

function sanitizeHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");
}

function sanitizeSvg(value: string) {
  return sanitizeHtml(value)
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\s(?:href|xlink:href)\s*=\s*(["'])https?:\/\/.*?\1/gi, "");
}

function projectText(project: ProjectRecord) {
  const payload = project.payload as Record<string, unknown> | null;
  if (payload && typeof payload === "object") {
    if (typeof payload.text === "string") return payload.text;
    if (typeof payload.title === "string") return payload.title;
  }
  return project.name;
}

function minimalPdf(text: string): Uint8Array {
  const safe = text.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)").slice(0, 4000);
  const stream = `BT /F1 18 Tf 72 720 Td (${safe}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i=1;i<offsets.length;i++) pdf += `${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return encoder.encode(pdf);
}

let crcTable: Uint32Array | undefined;
function crc32(data: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = encoder.encode(type);
  const out = Buffer.alloc(12 + data.byteLength);
  out.writeUInt32BE(data.byteLength, 0);
  Buffer.from(typeBytes).copy(out, 4);
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(new Uint8Array(Buffer.concat([Buffer.from(typeBytes), Buffer.from(data)]))), 8 + data.byteLength);
  return out;
}

function solidPng(width: number, height: number, textSeed: string, transparent = false): Uint8Array {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > MAX_RASTER_PIXELS) throw new Error("INVALID_RASTER_DIMENSIONS");
  const hash = createHash("sha256").update(textSeed).digest();
  const rgba = [hash[0]!, hash[1]!, hash[2]!, transparent ? 0 : 255];
  const scanline = Buffer.alloc(1 + width * 4);
  for (let x = 0; x < width; x++) scanline.set(rgba, 1 + x * 4);
  const raw = Buffer.alloc(scanline.byteLength * height);
  for (let y = 0; y < height; y++) scanline.copy(raw, y * scanline.byteLength);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return new Uint8Array(Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", new Uint8Array()),
  ]));
}

function zipArchive(files: Array<{ name: string; body: Uint8Array }>): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name.replace(/^\/+|\.\.[/\\]/g, ""));
    const body = Buffer.from(file.body);
    const crc = crc32(body);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0,6); local.writeUInt16LE(0,8);
    local.writeUInt32LE(crc,14); local.writeUInt32LE(body.length,18); local.writeUInt32LE(body.length,22); local.writeUInt16LE(name.length,26); name.copy(local,30);
    locals.push(local, body);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6); central.writeUInt32LE(crc,16);
    central.writeUInt32LE(body.length,20); central.writeUInt32LE(body.length,24); central.writeUInt16LE(name.length,28); central.writeUInt32LE(offset,42); name.copy(central,46);
    centrals.push(central);
    offset += local.length + body.length;
  }
  const centralBody = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(centralBody.length,12); end.writeUInt32LE(offset,16);
  return new Uint8Array(Buffer.concat([...locals, centralBody, end]));
}


function silentWav(durationSeconds = 1, sampleRate = 44100): Uint8Array {
  const safeDuration = Math.max(0.1, Math.min(60, durationSeconds));
  const samples = Math.floor(sampleRate * safeDuration);
  const dataSize = samples * 2;
  const out = Buffer.alloc(44 + dataSize);
  out.write("RIFF", 0); out.writeUInt32LE(36 + dataSize, 4); out.write("WAVE", 8);
  out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24); out.writeUInt32LE(sampleRate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write("data", 36); out.writeUInt32LE(dataSize, 40);
  return new Uint8Array(out);
}

const externalMediaType: Partial<Record<ProductionFormat, { extension: string; contentType: string }>> = {
  jpg: { extension: "jpg", contentType: "image/jpeg" }, webp: { extension: "webp", contentType: "image/webp" },
  tiff: { extension: "tiff", contentType: "image/tiff" }, avif: { extension: "avif", contentType: "image/avif" },
  gif: { extension: "gif", contentType: "image/gif" }, mp4: { extension: "mp4", contentType: "video/mp4" },
  webm: { extension: "webm", contentType: "video/webm" }, mp3: { extension: "mp3", contentType: "audio/mpeg" },
};

async function runExternalRenderer(project: ProjectRecord, request: ExportRequest, jobId: string, config: ExternalRendererConfig): Promise<RenderedArtifact> {
  const target = externalMediaType[request.format];
  if (!target) throw new Error(`RENDERER_NOT_CONFIGURED_${request.format.toUpperCase()}`);
  if (!config.ffmpegPath) throw new Error(`RENDERER_NOT_CONFIGURED_${request.format.toUpperCase()}`);
  const timeoutMs = Math.max(1000, Math.min(900000, config.timeoutMs ?? 120000));
  const work = await mkdtemp(join(tmpdir(), "yaposan-render-"));
  const base = `${project.id}-${jobId.slice(0,8)}`;
  const inputPng = join(work, "input.png");
  const inputWav = join(work, "input.wav");
  const output = join(work, `output.${target.extension}`);
  try {
    const width = request.options?.width ?? 1200;
    const height = request.options?.height ?? 630;
    const imageFormats = ["jpg", "webp", "tiff", "avif"];
    const videoFormats = ["gif", "mp4", "webm"];
    let args: string[];
    if (imageFormats.includes(request.format)) {
      await writeFile(inputPng, solidPng(width, height, projectText(project), request.options?.transparent));
      args = ["-y", "-i", inputPng, output];
    } else if (videoFormats.includes(request.format)) {
      await writeFile(inputPng, solidPng(width, height, projectText(project), false));
      const fps = Math.max(1, Math.min(60, request.options?.fps ?? 30));
      args = ["-y", "-loop", "1", "-framerate", String(fps), "-i", inputPng, "-t", "1"];
      if (request.format === "mp4") args.push("-c:v", "libx264", "-pix_fmt", "yuv420p");
      if (request.format === "webm") args.push("-c:v", "libvpx-vp9");
      args.push(output);
    } else {
      await writeFile(inputWav, silentWav());
      args = ["-y", "-i", inputWav, output];
    }
    await new Promise<void>((resolve, reject) => {
      const child = spawn(config.ffmpegPath!, args, { cwd: work, stdio: ["ignore", "ignore", "pipe"], shell: false, windowsHide: true });
      let stderr = "";
      child.stderr.on("data", chunk => { if (stderr.length < 8192) stderr += String(chunk); });
      const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("RENDERER_TIMEOUT")); }, timeoutMs);
      child.once("error", error => { clearTimeout(timer); reject(new Error(`RENDERER_START_FAILED: ${error.message}`)); });
      child.once("exit", code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`RENDERER_FAILED_${code}: ${stderr.trim().slice(0,500)}`)); });
    });
    const body = new Uint8Array(await readFile(output));
    if (!body.byteLength) throw new Error("EMPTY_RENDER_OUTPUT");
    return { name: `${base}.${target.extension}`, contentType: target.contentType, body };
  } finally { await rm(work, { recursive: true, force: true }); }
}

function safeHtml(project: ProjectRecord, payload: Record<string, unknown>) {
  const supplied = typeof payload.html === "string" ? sanitizeHtml(payload.html) : undefined;
  return supplied ?? `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)}</title></head><body><main><h1>${escapeHtml(project.name)}</h1><pre>${escapeHtml(JSON.stringify(project.payload, null, 2))}</pre></main></body></html>`;
}

export function renderProjectArtifact(project: ProjectRecord, request: ExportRequest, jobId: string): RenderedArtifact {
  const payload = (project.payload ?? {}) as Record<string, unknown>;
  const base = `${project.id}-${jobId.slice(0,8)}`;
  if (request.format === "html") return { name: `${base}.html`, contentType: "text/html; charset=utf-8", body: encoder.encode(safeHtml(project, payload)) };
  if (request.format === "svg") {
    const supplied = typeof payload.svg === "string" ? sanitizeSvg(payload.svg) : undefined;
    const svg = supplied ?? `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="white"/><text x="60" y="120" font-family="Arial" font-size="52" fill="black">${escapeHtml(projectText(project))}</text></svg>`;
    return { name: `${base}.svg`, contentType: "image/svg+xml", body: encoder.encode(svg) };
  }
  if (request.format === "pdf") return { name: `${base}.pdf`, contentType: "application/pdf", body: minimalPdf(projectText(project)) };
  if (request.format === "png") {
    const width = request.options?.width ?? 1200;
    const height = request.options?.height ?? 630;
    return { name: `${base}.png`, contentType: "image/png", body: solidPng(width, height, projectText(project), request.options?.transparent) };
  }
  if (request.format === "wav") return { name: `${base}.wav`, contentType: "audio/wav", body: silentWav() };
  if (request.format === "zip") {
    const html = encoder.encode(safeHtml(project, payload));
    const projectJson = encoder.encode(JSON.stringify({ id: project.id, name: project.name, revision: project.revision, payload: project.payload }, null, 2));
    const readme = encoder.encode("Yaposan portable web package\nOpen index.html in a browser.\n");
    return { name: `${base}.zip`, contentType: "application/zip", body: zipArchive([{name:"index.html",body:html},{name:"project.json",body:projectJson},{name:"README.txt",body:readme}]) };
  }
  throw new Error(`RENDERER_NOT_CONFIGURED_${request.format.toUpperCase()}`);
}

export async function executeExportJob(db: DatabaseAdapter, storage: ObjectStorage, job: JobRecord, renderer: ExternalRendererConfig = {}): Promise<ExportExecutionResult> {
  if (job.kind !== "export") throw new Error("EXPORT_JOB_REQUIRED");
  const request = job.payload as ExportRequest;
  const project = await db.get("projects", request.projectId);
  if (!project || project.workspaceId !== request.workspaceId) throw new Error("PROJECT_NOT_FOUND");
  const rendered = externalMediaType[request.format] ? await runExternalRenderer(project, request, job.id, renderer) : renderProjectArtifact(project, request, job.id);
  if (rendered.body.byteLength === 0) throw new Error("EMPTY_RENDER_OUTPUT");
  if (rendered.body.byteLength > MAX_ARTIFACT_BYTES) throw new Error("EXPORT_ARTIFACT_TOO_LARGE");
  const primary = await storage.put({ workspaceId: request.workspaceId, name: rendered.name, contentType: rendered.contentType, body: rendered.body });
  const manifest = buildExportManifest(job);
  manifest.artifacts[0] = { name: rendered.name, mediaType: rendered.contentType, role: "primary" };
  manifest.checksum = checksum(rendered.body);
  const manifestBody = encoder.encode(JSON.stringify({ ...manifest, publishedPrimary: { key: primary.key, size: primary.size, checksum: primary.checksum, url: primary.url } }, null, 2));
  let publishedManifest: StoredObject;
  try {
    publishedManifest = await storage.put({ workspaceId: request.workspaceId, name: manifest.artifacts[1].name, contentType: "application/json", body: manifestBody });
  } catch (error) {
    await storage.delete(primary.key).catch(() => undefined);
    throw error;
  }
  return {
    manifest,
    artifacts: [
      { ...primary, name: rendered.name, role: "primary" },
      { ...publishedManifest, name: manifest.artifacts[1].name, role: "manifest" },
    ],
    completedAt: new Date().toISOString(),
  };
}

export const locallySupportedExportFormats: readonly ProductionFormat[] = ["pdf", "svg", "html", "png", "zip", "wav"];
export const externallySupportedExportFormats: readonly ProductionFormat[] = ["jpg", "webp", "tiff", "avif", "gif", "mp4", "webm", "mp3"];
