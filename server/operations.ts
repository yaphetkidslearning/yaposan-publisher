import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type { DatabaseAdapter } from "./database";
import type { ObjectStorage } from "./storage";

export type RuntimeMetricsSnapshot = {
  startedAt: string;
  uptimeSeconds: number;
  activeRequests: number;
  totalRequests: number;
  responsesByStatus: Record<string, number>;
  requestsByMethod: Record<string, number>;
  averageDurationMs: number;
  maxDurationMs: number;
  errors: number;
};

export class RuntimeMetrics {
  private readonly started = Date.now();
  private active = 0;
  private total = 0;
  private durationTotal = 0;
  private durationMax = 0;
  private errors = 0;
  private readonly statuses = new Map<string, number>();
  private readonly methods = new Map<string, number>();

  begin(method = "UNKNOWN") {
    this.active += 1;
    this.total += 1;
    this.methods.set(method, (this.methods.get(method) ?? 0) + 1);
    const started = performance.now();
    let ended = false;
    return (statusCode = 500) => {
      if (ended) return;
      ended = true;
      const duration = Math.max(0, performance.now() - started);
      this.active = Math.max(0, this.active - 1);
      this.durationTotal += duration;
      this.durationMax = Math.max(this.durationMax, duration);
      const bucket = `${Math.floor(statusCode / 100)}xx`;
      this.statuses.set(bucket, (this.statuses.get(bucket) ?? 0) + 1);
      if (statusCode >= 500) this.errors += 1;
    };
  }

  snapshot(now = Date.now()): RuntimeMetricsSnapshot {
    return {
      startedAt: new Date(this.started).toISOString(),
      uptimeSeconds: Math.max(0, Math.floor((now - this.started) / 1000)),
      activeRequests: this.active,
      totalRequests: this.total,
      responsesByStatus: Object.fromEntries(this.statuses),
      requestsByMethod: Object.fromEntries(this.methods),
      averageDurationMs: this.total ? Number((this.durationTotal / this.total).toFixed(2)) : 0,
      maxDurationMs: Number(this.durationMax.toFixed(2)),
      errors: this.errors,
    };
  }

  prometheus(now = Date.now()) {
    const value = this.snapshot(now);
    const lines = [
      "# HELP yaposan_uptime_seconds Process uptime in seconds",
      "# TYPE yaposan_uptime_seconds gauge",
      `yaposan_uptime_seconds ${value.uptimeSeconds}`,
      "# HELP yaposan_http_requests_total Total HTTP requests",
      "# TYPE yaposan_http_requests_total counter",
      `yaposan_http_requests_total ${value.totalRequests}`,
      "# HELP yaposan_http_active_requests Current active HTTP requests",
      "# TYPE yaposan_http_active_requests gauge",
      `yaposan_http_active_requests ${value.activeRequests}`,
      "# HELP yaposan_http_errors_total Total 5xx responses",
      "# TYPE yaposan_http_errors_total counter",
      `yaposan_http_errors_total ${value.errors}`,
      "# HELP yaposan_http_request_duration_ms_average Average request duration",
      "# TYPE yaposan_http_request_duration_ms_average gauge",
      `yaposan_http_request_duration_ms_average ${value.averageDurationMs}`,
      "# HELP yaposan_http_request_duration_ms_max Maximum request duration",
      "# TYPE yaposan_http_request_duration_ms_max gauge",
      `yaposan_http_request_duration_ms_max ${value.maxDurationMs}`,
    ];
    for (const [status, count] of Object.entries(value.responsesByStatus)) lines.push(`yaposan_http_responses_total{status_class="${status}"} ${count}`);
    for (const [method, count] of Object.entries(value.requestsByMethod)) lines.push(`yaposan_http_requests_by_method_total{method="${method.replace(/[^A-Z]/gi, "")}"} ${count}`);
    return `${lines.join("\n")}\n`;
  }
}

export function clientIp(req: Pick<IncomingMessage, "headers" | "socket">, trustProxy: boolean) {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
    if (first && /^[0-9a-f:.]+$/i.test(first)) return first;
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function safeTokenEqual(provided: string | undefined, expected: string | undefined) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function withTimeout<T>(label: string, milliseconds: number, task: () => Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      task(),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label.toUpperCase()}_TIMEOUT`)), milliseconds); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type ReadinessCheck = { ok: boolean; latencyMs: number; message?: string };
export type ReadinessReport = { ready: boolean; checkedAt: string; checks: Record<string, ReadinessCheck> };

async function timedCheck(task: () => Promise<void>): Promise<ReadinessCheck> {
  const start = performance.now();
  try { await task(); return { ok: true, latencyMs: Number((performance.now() - start).toFixed(2)) }; }
  catch (error) { return { ok: false, latencyMs: Number((performance.now() - start).toFixed(2)), message: error instanceof Error ? error.message : "CHECK_FAILED" }; }
}

export async function runReadinessChecks(input: {
  database: DatabaseAdapter;
  storage: ObjectStorage;
  configurationIssues: string[];
  timeoutMs: number;
  storageProbe?: boolean;
}): Promise<ReadinessReport> {
  const checks: Record<string, ReadinessCheck> = {};
  checks.configuration = input.configurationIssues.length === 0 ? { ok: true, latencyMs: 0 } : { ok: false, latencyMs: 0, message: input.configurationIssues.join("; ") };
  checks.database = await timedCheck(() => withTimeout("database", input.timeoutMs, async () => { await input.database.find("users", () => false); }));
  if (input.storageProbe) {
    checks.storage = await timedCheck(() => withTimeout("storage", input.timeoutMs, async () => {
      const marker = Buffer.from(`ready:${Date.now()}`);
      const object = await input.storage.put({ workspaceId: "health", name: "ready.txt", contentType: "text/plain", body: marker });
      const downloaded = await input.storage.get(object.key);
      if (!Buffer.from(downloaded).equals(marker)) throw new Error("STORAGE_PROBE_MISMATCH");
      await input.storage.delete(object.key);
    }));
  } else checks.storage = { ok: true, latencyMs: 0, message: "passive" };
  return { ready: Object.values(checks).every(check => check.ok), checkedAt: new Date().toISOString(), checks };
}

export function buildReleaseEvidence(input: { version: string; commitSha?: string; buildId?: string; nodeEnv?: string; configIssues: string[]; testsPassed?: number; testsFailed?: number }) {
  const payload = {
    version: input.version,
    commitSha: input.commitSha ?? "unknown",
    buildId: input.buildId ?? "local",
    environment: input.nodeEnv ?? "development",
    configurationReady: input.configIssues.length === 0,
    configurationIssues: [...input.configIssues].sort(),
    testsPassed: input.testsPassed ?? null,
    testsFailed: input.testsFailed ?? null,
  };
  return { ...payload, checksum: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
}

export function installGracefulShutdown(input: { server: Server; database: DatabaseAdapter; timeoutMs: number; signals?: NodeJS.Signals[]; exit?: (code: number) => void; logger?: (record: Record<string, unknown>) => void }) {
  const signals = input.signals ?? ["SIGTERM", "SIGINT"];
  const exit = input.exit ?? process.exit;
  const logger = input.logger ?? (record => console.log(JSON.stringify(record)));
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger({ level: "info", event: "shutdown_started", signal });
    const forced = setTimeout(() => { logger({ level: "error", event: "shutdown_forced" }); exit(1); }, input.timeoutMs);
    forced.unref();
    try {
      await new Promise<void>((resolve, reject) => input.server.close(error => error ? reject(error) : resolve()));
      await input.database.close();
      clearTimeout(forced);
      logger({ level: "info", event: "shutdown_complete" });
      exit(0);
    } catch (error) {
      clearTimeout(forced);
      logger({ level: "error", event: "shutdown_failed", message: error instanceof Error ? error.message : "unknown" });
      exit(1);
    }
  };
  for (const signal of signals) process.once(signal, () => { void shutdown(signal); });
  return { shutdown, isShuttingDown: () => shuttingDown };
}
