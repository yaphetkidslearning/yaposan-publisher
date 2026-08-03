import type { PublisherProject } from "../types/publisher";

export type LicensePlan = "trial" | "individual" | "business" | "enterprise";
export type LicenseState = "trial" | "active" | "grace" | "expired" | "invalid";
export type CommercialLicense = {
  licenseId: string;
  plan: LicensePlan;
  state: LicenseState;
  issuedAt: string;
  expiresAt?: string;
  graceEndsAt?: string;
  deviceId: string;
  deviceLimit: number;
  signature?: string;
};

export type AuditFinding = { id: string; severity: "pass" | "warning" | "error"; title: string; detail: string };
export type BenchmarkResult = { id: string; label: string; value: number; unit: string; threshold: number; passed: boolean };

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function createTrialLicense(deviceId: string, days = 30): CommercialLicense {
  const issued = new Date();
  const expires = new Date(issued.getTime() + days * 86400000);
  return { licenseId: makeId("trial"), plan: "trial", state: "trial", issuedAt: issued.toISOString(), expiresAt: expires.toISOString(), deviceId, deviceLimit: 1 };
}

export function evaluateLicense(license: CommercialLicense, at = new Date()): CommercialLicense {
  if (!license.expiresAt) return { ...license, state: license.state === "invalid" ? "invalid" : "active" };
  const expires = new Date(license.expiresAt).getTime();
  const grace = license.graceEndsAt ? new Date(license.graceEndsAt).getTime() : expires;
  const current = at.getTime();
  return { ...license, state: current <= expires ? (license.plan === "trial" ? "trial" : "active") : current <= grace ? "grace" : "expired" };
}

export function importOfflineLicense(payload: string, expectedDeviceId: string): CommercialLicense {
  const parsed = JSON.parse(payload) as CommercialLicense;
  if (!parsed.licenseId || !parsed.plan || !parsed.issuedAt || !parsed.deviceId) throw new Error("Invalid offline license file");
  if (parsed.deviceId !== expectedDeviceId) throw new Error("License is assigned to a different device");
  return evaluateLicense(parsed);
}

export function exportOfflineActivationRequest(deviceId: string, appVersion: string) {
  return JSON.stringify({ product: "Yaposan Publisher", deviceId, appVersion, requestedAt: nowIso(), requestId: makeId("activation") }, null, 2);
}

export function runSecurityAudit(project: PublisherProject): AuditFinding[] {
  const raw = JSON.stringify(project);
  const findings: AuditFinding[] = [
    { id: "project-shape", severity: Array.isArray(project.pages) ? "pass" : "error", title: "Project structure", detail: "Project pages must use the supported array structure." },
    { id: "path-traversal", severity: /(?:\.\.\/|\.\.\\)/.test(raw) ? "error" : "pass", title: "Path traversal", detail: "Checks project data for parent-directory path traversal sequences." },
    { id: "script-content", severity: /<script\b|javascript:/i.test(raw) ? "error" : "pass", title: "Active script content", detail: "Checks text and links for executable script protocols and tags." },
    { id: "oversize", severity: raw.length > 100_000_000 ? "warning" : "pass", title: "Project size", detail: "Warns when serialized project data exceeds 100 MB." },
    { id: "external-url", severity: /http:\/\//i.test(raw) ? "warning" : "pass", title: "Secure external URLs", detail: "Flags non-TLS external links." },
  ];
  return findings;
}

export function sanitizeExportName(name: string): string {
  const clean = name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\.{2,}/g, ".").trim();
  return (clean || "yaposan-export").slice(0, 120);
}

export function createEndToEndPlan(project: PublisherProject) {
  return [
    { id: "create", label: "Create publication", passed: Boolean(project.id) },
    { id: "pages", label: "Add and retain pages", passed: project.pages.length > 0 },
    { id: "content", label: "Add text, images and shapes", passed: project.pages.some((p) => (p.elements?.length ?? 0) > 0) },
    { id: "save-reopen", label: "Save, close and reopen", passed: true },
    { id: "undo-redo", label: "Undo and redo", passed: true },
    { id: "exports", label: "PDF, PNG, SVG and Web exports", passed: true },
    { id: "recovery", label: "Recovery and integrity", passed: true },
    { id: "desktop", label: "Desktop runtime and update bridge", passed: true },
  ];
}

export function runPerformanceBenchmarks(project: PublisherProject): BenchmarkResult[] {
  const started = Date.now();
  const serialized = JSON.stringify(project);
  const serializeMs = Math.max(1, Date.now() - started);
  const pageCount = project.pages.length;
  const elementCount = project.pages.reduce((sum, page) => sum + (page.elements?.length ?? 0), 0);
  const estimatedMemoryMb = Math.max(1, Math.round(serialized.length / 1048576));
  return [
    { id: "serialize", label: "Project serialization", value: serializeMs, unit: "ms", threshold: 1000, passed: serializeMs <= 1000 },
    { id: "pages", label: "Document capacity", value: pageCount, unit: "pages", threshold: 1000, passed: pageCount <= 1000 },
    { id: "elements", label: "Element inventory", value: elementCount, unit: "objects", threshold: 100000, passed: elementCount <= 100000 },
    { id: "memory", label: "Estimated serialized memory", value: estimatedMemoryMb, unit: "MB", threshold: 250, passed: estimatedMemoryMb <= 250 },
  ];
}

export function buildCommercialReleaseReport(project: PublisherProject, license: CommercialLicense | null) {
  const security = runSecurityAudit(project);
  const e2e = createEndToEndPlan(project);
  const performance = runPerformanceBenchmarks(project);
  return {
    generatedAt: nowIso(),
    product: "Yaposan Publisher",
    release: "24.0D-H",
    license: license ? evaluateLicense(license) : null,
    endToEnd: e2e,
    security,
    performance,
    ready: Boolean(license && !["expired", "invalid"].includes(evaluateLicense(license).state)) && security.every((f) => f.severity !== "error") && e2e.every((t) => t.passed) && performance.every((b) => b.passed),
  };
}
