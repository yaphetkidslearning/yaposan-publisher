import type { PublisherProject } from "../types/publisher";

export type ValidationSeverity = "pass" | "warning" | "error";
export type ValidationResult = { id: string; severity: ValidationSeverity; title: string; detail: string };
export type LicenseEnvelope = {
  schema: "yaposan-license-v1";
  payload: string;
  signature: string;
  algorithm: "RSASSA-PKCS1-v1_5";
  keyId: string;
};
export type BenchmarkSnapshot = {
  generatedAt: string;
  pageCount: number;
  elementCount: number;
  serializedBytes: number;
  stringifyMs: number;
  parseMs: number;
  cloneMs: number;
  passed: boolean;
};

const SAFE_PROTOCOLS = new Set(["https:", "mailto:", "tel:"]);
const MAX_IMPORT_BYTES = 250 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 20_000;
const MAX_ARCHIVE_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;

export function validateExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeHtmlFragment(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "");
}

export function sanitizeSvg(value: string): string {
  return sanitizeHtmlFragment(value)
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)>/gi, "")
    .replace(/\s(?:href|xlink:href)\s*=\s*["'](?:javascript:|data:text\/html)[^"']*["']/gi, "");
}

export function validateImportFile(name: string, size: number, mimeType = ""): ValidationResult[] {
  const lower = name.toLowerCase();
  const allowed = [".yaposan", ".json", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf", ".csv", ".xlsx", ".zip"];
  const extensionAllowed = allowed.some((extension) => lower.endsWith(extension));
  return [
    { id: "import-size", severity: size > MAX_IMPORT_BYTES ? "error" : "pass", title: "Import size", detail: `${size} bytes; maximum ${MAX_IMPORT_BYTES} bytes.` },
    { id: "import-extension", severity: extensionAllowed ? "pass" : "error", title: "Import extension", detail: extensionAllowed ? "Supported file extension." : "Unsupported file extension." },
    { id: "import-mime", severity: mimeType.includes("html") || mimeType.includes("javascript") ? "error" : "pass", title: "Import MIME type", detail: mimeType || "MIME type not supplied." },
  ];
}

export function validateArchiveEntries(entries: Array<{ name: string; uncompressedSize: number }>): ValidationResult[] {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.uncompressedSize), 0);
  const traversal = entries.some((entry) => /(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[A-Za-z]:/.test(entry.name));
  return [
    { id: "archive-entry-count", severity: entries.length > MAX_ARCHIVE_ENTRIES ? "error" : "pass", title: "Archive entry count", detail: `${entries.length} entries.` },
    { id: "archive-expanded-size", severity: total > MAX_ARCHIVE_EXPANDED_BYTES ? "error" : "pass", title: "Archive expanded size", detail: `${total} bytes expanded.` },
    { id: "archive-paths", severity: traversal ? "error" : "pass", title: "Archive paths", detail: traversal ? "Unsafe absolute or parent path detected." : "Archive paths are relative and contained." },
  ];
}

function decodeBase64(value: string): Uint8Array {
  if (typeof globalThis.atob === "function") return Uint8Array.from(globalThis.atob(value), (character) => character.charCodeAt(0));
  throw new Error("Base64 decoding is unavailable in this runtime");
}

export async function verifyLicenseEnvelope(envelope: LicenseEnvelope, publicKeyPem: string): Promise<boolean> {
  if (envelope.schema !== "yaposan-license-v1" || envelope.algorithm !== "RSASSA-PKCS1-v1_5") return false;
  if (!globalThis.crypto?.subtle) throw new Error("WebCrypto is unavailable in this runtime");
  const pem = publicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
  const key = await globalThis.crypto.subtle.importKey("spki", decodeBase64(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  return globalThis.crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodeBase64(envelope.signature), new TextEncoder().encode(envelope.payload));
}

export function runRealProjectRoundTrip(project: PublisherProject): { passed: boolean; serializedBytes: number; detail: string } {
  const encoded = JSON.stringify(project);
  const restored = JSON.parse(encoded) as PublisherProject;
  const passed = restored.id === project.id && restored.pages.length === project.pages.length && JSON.stringify(restored) === encoded;
  return { passed, serializedBytes: new TextEncoder().encode(encoded).byteLength, detail: passed ? "Project survived an exact serialize/parse round trip." : "Project changed during round trip." };
}

export function runProductionBenchmark(project: PublisherProject): BenchmarkSnapshot {
  const stringifyStart = performance.now();
  const encoded = JSON.stringify(project);
  const stringifyMs = performance.now() - stringifyStart;
  const parseStart = performance.now();
  JSON.parse(encoded);
  const parseMs = performance.now() - parseStart;
  const cloneStart = performance.now();
  if (typeof structuredClone === "function") structuredClone(project); else JSON.parse(encoded);
  const cloneMs = performance.now() - cloneStart;
  const pageCount = project.pages.length;
  const elementCount = project.pages.reduce((sum, page) => sum + (page.elements?.length ?? 0), 0);
  const serializedBytes = new TextEncoder().encode(encoded).byteLength;
  return {
    generatedAt: new Date().toISOString(), pageCount, elementCount, serializedBytes,
    stringifyMs: Math.round(stringifyMs * 100) / 100,
    parseMs: Math.round(parseMs * 100) / 100,
    cloneMs: Math.round(cloneMs * 100) / 100,
    passed: stringifyMs < 1500 && parseMs < 1500 && cloneMs < 2000 && serializedBytes < MAX_IMPORT_BYTES,
  };
}
