import { createHash } from "node:crypto";

export type RequestSecurityLimits = {
  maxBodyBytes: number;
  maxJsonDepth: number;
  maxJsonNodes: number;
  maxStringLength: number;
  maxQueryParameters: number;
  maxPathLength: number;
};

export const DEFAULT_REQUEST_SECURITY_LIMITS: RequestSecurityLimits = {
  maxBodyBytes: 20_000_000,
  maxJsonDepth: 32,
  maxJsonNodes: 50_000,
  maxStringLength: 2_000_000,
  maxQueryParameters: 100,
  maxPathLength: 2048,
};

export type SecurityFinding = {
  code: string;
  message: string;
};

export function validateRequestTarget(rawUrl: string, limits = DEFAULT_REQUEST_SECURITY_LIMITS) {
  const findings: SecurityFinding[] = [];
  if (!rawUrl.startsWith("/")) findings.push({ code: "INVALID_TARGET", message: "Request target must be origin-form" });
  if (rawUrl.length > limits.maxPathLength) findings.push({ code: "TARGET_TOO_LONG", message: "Request target exceeds the configured length" });
  let decoded = rawUrl;
  try { decoded = decodeURIComponent(rawUrl); } catch { findings.push({ code: "INVALID_ENCODING", message: "Request target contains invalid percent encoding" }); }
  const lower = decoded.toLowerCase();
  if (/(^|[\\/])\.\.([\\/]|$)/.test(lower)) findings.push({ code: "PATH_TRAVERSAL", message: "Path traversal segments are not allowed" });
  if (lower.includes("\0")) findings.push({ code: "NULL_BYTE", message: "Null bytes are not allowed" });
  const query = rawUrl.split("?", 2)[1] ?? "";
  const count = query ? query.split("&").filter(Boolean).length : 0;
  if (count > limits.maxQueryParameters) findings.push({ code: "TOO_MANY_QUERY_PARAMETERS", message: "Query parameter count exceeds the configured limit" });
  return { valid: findings.length === 0, findings };
}

export function inspectJsonComplexity(value: unknown, limits = DEFAULT_REQUEST_SECURITY_LIMITS) {
  let nodes = 0;
  let maximumDepth = 0;
  let maximumStringLength = 0;
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 1 }];
  const seen = new Set<object>();
  while (stack.length) {
    const current = stack.pop()!;
    nodes++;
    maximumDepth = Math.max(maximumDepth, current.depth);
    if (nodes > limits.maxJsonNodes) return { valid: false, nodes, maximumDepth, maximumStringLength, code: "JSON_NODE_LIMIT" };
    if (maximumDepth > limits.maxJsonDepth) return { valid: false, nodes, maximumDepth, maximumStringLength, code: "JSON_DEPTH_LIMIT" };
    if (typeof current.value === "string") {
      maximumStringLength = Math.max(maximumStringLength, current.value.length);
      if (current.value.length > limits.maxStringLength) return { valid: false, nodes, maximumDepth, maximumStringLength, code: "JSON_STRING_LIMIT" };
    } else if (current.value && typeof current.value === "object") {
      if (seen.has(current.value as object)) return { valid: false, nodes, maximumDepth, maximumStringLength, code: "JSON_CYCLE" };
      seen.add(current.value as object);
      const children = Array.isArray(current.value) ? current.value : Object.values(current.value as Record<string, unknown>);
      for (const child of children) stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return { valid: true, nodes, maximumDepth, maximumStringLength };
}

export function detectInjectionSignals(input: string) {
  const normalized = input.normalize("NFKC").toLowerCase();
  const findings: string[] = [];
  if (/<\s*script\b|javascript\s*:|on(?:error|load|click)\s*=/i.test(normalized)) findings.push("XSS_SIGNAL");
  if (/(?:'|")\s*(?:or|and)\s+(?:'?\w+'?\s*=\s*'?\w+'?|1\s*=\s*1)|\bunion\s+(?:all\s+)?select\b|;\s*(?:drop|delete|update|insert)\b/i.test(normalized)) findings.push("SQL_INJECTION_SIGNAL");
  if (/\$\{jndi:(?:ldap|rmi|dns|iiop):/i.test(normalized)) findings.push("JNDI_INJECTION_SIGNAL");
  if (/(?:\.\.[\\/])|(?:%2e){2}(?:%2f|%5c)/i.test(normalized)) findings.push("PATH_TRAVERSAL_SIGNAL");
  return [...new Set(findings)];
}

const MAGIC: Array<{ mime: string; matches: (b: Buffer) => boolean }> = [
  { mime: "image/png", matches: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  { mime: "image/jpeg", matches: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "application/pdf", matches: b => b.subarray(0, 5).toString() === "%PDF-" },
  { mime: "application/zip", matches: b => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && [0x03,0x05,0x07].includes(b[2]) && [0x04,0x06,0x08].includes(b[3]) },
];

export function verifyFileSignature(contentType: string, bytes: Buffer) {
  const rule = MAGIC.find(item => item.mime === contentType.toLowerCase());
  if (!rule) return { verified: false, supported: false, checksum: createHash("sha256").update(bytes).digest("hex") };
  return { verified: rule.matches(bytes), supported: true, checksum: createHash("sha256").update(bytes).digest("hex") };
}

export class BoundedRateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number; lastSeen: number }>();
  private readonly options: { limit: number; windowMs: number; maxEntries: number };
  constructor(options: { limit: number; windowMs: number; maxEntries: number }) {
    if (options.limit < 1 || options.windowMs < 1 || options.maxEntries < 1) throw new Error("Invalid rate limiter configuration");
    this.options = options;
  }
  check(key: string, now = Date.now()) {
    this.prune(now);
    let entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + this.options.windowMs, lastSeen: now };
    entry.count++;
    entry.lastSeen = now;
    this.entries.set(key, entry);
    if (this.entries.size > this.options.maxEntries) {
      const oldest = [...this.entries.entries()].sort((a,b) => a[1].lastSeen - b[1].lastSeen)[0]?.[0];
      if (oldest && oldest !== key) this.entries.delete(oldest);
    }
    return { allowed: entry.count <= this.options.limit, remaining: Math.max(0, this.options.limit - entry.count), resetAt: entry.resetAt };
  }
  prune(now = Date.now()) {
    for (const [key, value] of this.entries) if (value.resetAt <= now) this.entries.delete(key);
  }
  get size() { return this.entries.size; }
}

export type PerformanceSample = {
  name: string;
  durationMs: number;
  memoryBytes?: number;
  outputBytes?: number;
};

export function evaluatePerformanceBudget(samples: PerformanceSample[], budget: { maxP95Ms: number; maxMemoryBytes: number; maxOutputBytes: number }) {
  const durations = samples.map(s => s.durationMs).filter(Number.isFinite).sort((a,b) => a-b);
  const p95 = durations.length ? durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] : 0;
  const peakMemoryBytes = Math.max(0, ...samples.map(s => s.memoryBytes ?? 0));
  const largestOutputBytes = Math.max(0, ...samples.map(s => s.outputBytes ?? 0));
  const failures: string[] = [];
  if (p95 > budget.maxP95Ms) failures.push("P95_LATENCY_EXCEEDED");
  if (peakMemoryBytes > budget.maxMemoryBytes) failures.push("MEMORY_BUDGET_EXCEEDED");
  if (largestOutputBytes > budget.maxOutputBytes) failures.push("OUTPUT_BUDGET_EXCEEDED");
  return { passed: failures.length === 0, p95Ms: p95, peakMemoryBytes, largestOutputBytes, failures };
}
