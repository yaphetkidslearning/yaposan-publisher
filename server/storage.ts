import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

export type StoredObject = { key: string; size: number; checksum: string; contentType: string; url?: string };
export type UploadPlan = { key: string; method: "PUT"; uploadUrl: string; headers: Record<string, string>; expiresAt: string };
export interface ObjectStorage {
  put(input: { workspaceId: string; name: string; contentType: string; body: Uint8Array }): Promise<StoredObject>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  createUploadPlan(input: { workspaceId: string; name: string; contentType: string; size: number }): Promise<UploadPlan>;
}

const clean = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();
const encodePath = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export class LocalObjectStorage implements ObjectStorage {
  private readonly root: string;
  private readonly publicBaseUrl: string;
  constructor(root = join(process.cwd(), ".yaposan-storage"), publicBaseUrl = "http://localhost:4100/api/v1/assets/raw") { this.root = root; this.publicBaseUrl = publicBaseUrl; }
  private path(key: string) { return join(this.root, ...key.split("/")); }
  async put(input: { workspaceId: string; name: string; contentType: string; body: Uint8Array }) {
    const key = `${clean(input.workspaceId)}/${randomUUID()}-${clean(input.name)}`;
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body);
    return { key, size: input.body.byteLength, checksum: sha256(input.body), contentType: input.contentType, url: `${this.publicBaseUrl}/${encodeURIComponent(key)}` };
  }
  async get(key: string) { return new Uint8Array(await readFile(this.path(key))); }
  async delete(key: string) { await rm(this.path(key), { force: true }); }
  async createUploadPlan(input: { workspaceId: string; name: string; contentType: string; size: number }) {
    const key = `${clean(input.workspaceId)}/${randomUUID()}-${clean(input.name)}`;
    return { key, method: "PUT" as const, uploadUrl: `${this.publicBaseUrl}/${encodeURIComponent(key)}`, headers: { "content-type": input.contentType, "x-yaposan-size": String(input.size) }, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  }
}

export type R2StorageOptions = { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; region?: string; publicBaseUrl?: string; expiresSeconds?: number };

export class R2ObjectStorage implements ObjectStorage {
  private readonly endpoint: URL;
  private readonly expiresSeconds: number;
  private readonly options: R2StorageOptions;
  constructor(options: R2StorageOptions) {
    this.options = options;
    this.endpoint = new URL(options.endpoint);
    this.expiresSeconds = Math.min(3600, Math.max(60, options.expiresSeconds ?? 900));
  }
  private objectUrl(key: string) { return new URL(`${this.endpoint.pathname.replace(/\/$/, "")}/${encodeURIComponent(this.options.bucket)}/${encodePath(key)}`, this.endpoint.origin); }
  private signingKey(date: string) {
    const kDate = hmac(`AWS4${this.options.secretAccessKey}`, date);
    const kRegion = hmac(kDate, this.options.region ?? "auto");
    const kService = hmac(kRegion, "s3");
    return hmac(kService, "aws4_request");
  }
  private presign(method: "GET" | "PUT" | "DELETE", key: string, contentType?: string): { url: string; headers: Record<string, string> } {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = amzDate.slice(0, 8);
    const region = this.options.region ?? "auto";
    const scope = `${date}/${region}/s3/aws4_request`;
    const url = this.objectUrl(key);
    const signedHeaders = "host";
    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set("X-Amz-Credential", `${this.options.accessKeyId}/${scope}`);
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(this.expiresSeconds));
    url.searchParams.set("X-Amz-SignedHeaders", signedHeaders);
    const query = [...url.searchParams.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    const canonicalRequest = [method, url.pathname, query, `host:${url.host}\n`, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
    url.searchParams.set("X-Amz-Signature", createHmac("sha256", this.signingKey(date)).update(stringToSign).digest("hex"));
    return { url: url.toString(), headers: contentType ? { "content-type": contentType } : {} };
  }
  async put(input: { workspaceId: string; name: string; contentType: string; body: Uint8Array }) {
    const key = `${clean(input.workspaceId)}/${randomUUID()}-${clean(input.name)}`;
    const signed = this.presign("PUT", key, input.contentType);
    const response = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: Buffer.from(input.body) });
    if (!response.ok) throw new Error(`R2_UPLOAD_FAILED_${response.status}`);
    return { key, size: input.body.byteLength, checksum: sha256(input.body), contentType: input.contentType, url: this.options.publicBaseUrl ? `${this.options.publicBaseUrl.replace(/\/$/, "")}/${encodePath(key)}` : undefined };
  }
  async get(key: string) {
    const response = await fetch(this.presign("GET", key).url);
    if (!response.ok) throw new Error(`R2_DOWNLOAD_FAILED_${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
  async delete(key: string) {
    const response = await fetch(this.presign("DELETE", key).url, { method: "DELETE" });
    if (!response.ok && response.status !== 404) throw new Error(`R2_DELETE_FAILED_${response.status}`);
  }
  async createUploadPlan(input: { workspaceId: string; name: string; contentType: string; size: number }) {
    const key = `${clean(input.workspaceId)}/${randomUUID()}-${clean(input.name)}`;
    const signed = this.presign("PUT", key, input.contentType);
    return { key, method: "PUT" as const, uploadUrl: signed.url, headers: signed.headers, expiresAt: new Date(Date.now() + this.expiresSeconds * 1000).toISOString() };
  }
}
