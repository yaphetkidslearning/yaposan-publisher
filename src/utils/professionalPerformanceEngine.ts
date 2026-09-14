export type Phase46Priority = "immediate" | "user-blocking" | "background" | "idle";
export type Phase46CacheKind = "thumbnail" | "asset" | "font" | "document" | "render";
export type Phase46MetricName = "startup" | "interaction" | "canvas-render" | "thumbnail-render" | "autosave" | "export" | "memory";

export type Phase46PerformanceBudget = {
  metric: Phase46MetricName;
  label: string;
  targetMs: number;
  warningMs: number;
};

export type Phase46Measurement = {
  id: string;
  metric: Phase46MetricName;
  durationMs: number;
  recordedAt: string;
  detail?: string;
};

export type Phase46CacheEntry<T = unknown> = {
  key: string;
  kind: Phase46CacheKind;
  value: T;
  bytes: number;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt?: number;
};

export type Phase46Task = {
  id: string;
  label: string;
  priority: Phase46Priority;
  run: () => void | Promise<void>;
};

export type Phase46HistorySnapshot<T> = {
  id: string;
  value: T;
  createdAt: number;
  bytes: number;
};

export const PHASE46_PERFORMANCE_BUDGETS: Phase46PerformanceBudget[] = [
  { metric: "startup", label: "Application startup", targetMs: 1800, warningMs: 3000 },
  { metric: "interaction", label: "Editor interaction", targetMs: 50, warningMs: 100 },
  { metric: "canvas-render", label: "Canvas render", targetMs: 16, warningMs: 32 },
  { metric: "thumbnail-render", label: "Thumbnail render", targetMs: 120, warningMs: 250 },
  { metric: "autosave", label: "Background autosave", targetMs: 500, warningMs: 1200 },
  { metric: "export", label: "Export preparation", targetMs: 2000, warningMs: 5000 },
  { metric: "memory", label: "Memory maintenance", targetMs: 80, warningMs: 180 },
];

export class Phase46LRUCache<T = unknown> {
  private entries = new Map<string, Phase46CacheEntry<T>>();
  constructor(public readonly maxBytes = 64 * 1024 * 1024) {}

  get sizeBytes() { return [...this.entries.values()].reduce((sum, entry) => sum + entry.bytes, 0); }
  get count() { return this.entries.size; }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    entry.lastAccessedAt = Date.now();
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, options: { kind?: Phase46CacheKind; bytes?: number; ttlMs?: number } = {}) {
    const now = Date.now();
    this.entries.delete(key);
    this.entries.set(key, {
      key,
      value,
      kind: options.kind ?? "asset",
      bytes: Math.max(1, options.bytes ?? estimatePhase46Bytes(value)),
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: options.ttlMs ? now + options.ttlMs : undefined,
    });
    this.trim();
  }

  delete(key: string) { return this.entries.delete(key); }
  clear() { this.entries.clear(); }
  list() { return [...this.entries.values()]; }

  private trim() {
    while (this.sizeBytes > this.maxBytes && this.entries.size > 0) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }
}

export class Phase46TaskScheduler {
  private queues: Record<Phase46Priority, Phase46Task[]> = {
    immediate: [],
    "user-blocking": [],
    background: [],
    idle: [],
  };
  private running = false;

  enqueue(task: Phase46Task) {
    this.queues[task.priority].push(task);
    void this.flush();
  }

  pending() { return Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0); }

  async flush() {
    if (this.running) return;
    this.running = true;
    try {
      const order: Phase46Priority[] = ["immediate", "user-blocking", "background", "idle"];
      while (this.pending() > 0) {
        const priority = order.find((item) => this.queues[item].length > 0);
        if (!priority) break;
        const task = this.queues[priority].shift();
        if (task) await task.run();
        if (priority === "background" || priority === "idle") await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      this.running = false;
    }
  }
}

export class Phase46UndoHistory<T> {
  private past: Phase46HistorySnapshot<T>[] = [];
  private future: Phase46HistorySnapshot<T>[] = [];
  constructor(private readonly maxSnapshots = 80, private readonly maxBytes = 24 * 1024 * 1024) {}

  push(value: T) {
    const snapshot: Phase46HistorySnapshot<T> = {
      id: `phase46-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      value,
      createdAt: Date.now(),
      bytes: estimatePhase46Bytes(value),
    };
    this.past.push(snapshot);
    this.future = [];
    this.compact();
  }

  undo(current: T): T | undefined {
    const snapshot = this.past.pop();
    if (!snapshot) return undefined;
    this.future.push({ id: `phase46-redo-${Date.now()}`, value: current, createdAt: Date.now(), bytes: estimatePhase46Bytes(current) });
    return snapshot.value;
  }

  redo(current: T): T | undefined {
    const snapshot = this.future.pop();
    if (!snapshot) return undefined;
    this.past.push({ id: `phase46-undo-${Date.now()}`, value: current, createdAt: Date.now(), bytes: estimatePhase46Bytes(current) });
    return snapshot.value;
  }

  stats() { return { undo: this.past.length, redo: this.future.length, bytes: this.past.reduce((sum, item) => sum + item.bytes, 0) }; }

  private compact() {
    while (this.past.length > this.maxSnapshots || this.past.reduce((sum, item) => sum + item.bytes, 0) > this.maxBytes) this.past.shift();
  }
}

export function estimatePhase46Bytes(value: unknown): number {
  try { return new TextEncoder().encode(JSON.stringify(value)).length; }
  catch { return 1024; }
}

export function getPhase46VirtualWindow(totalItems: number, itemSize: number, viewportSize: number, scrollOffset: number, overscan = 3) {
  const safeSize = Math.max(1, itemSize);
  const start = Math.max(0, Math.floor(scrollOffset / safeSize) - overscan);
  const visible = Math.ceil(viewportSize / safeSize) + overscan * 2;
  const end = Math.min(totalItems, start + visible);
  return { start, end, offset: start * safeSize, totalSize: totalItems * safeSize };
}

export function recordPhase46Measurement(metric: Phase46MetricName, durationMs: number, detail?: string): Phase46Measurement {
  return { id: `phase46-${metric}-${Date.now()}`, metric, durationMs, detail, recordedAt: new Date().toISOString() };
}

export function getPhase46MetricStatus(measurement: Phase46Measurement) {
  const budget = PHASE46_PERFORMANCE_BUDGETS.find((item) => item.metric === measurement.metric);
  if (!budget) return "unknown" as const;
  if (measurement.durationMs <= budget.targetMs) return "healthy" as const;
  if (measurement.durationMs <= budget.warningMs) return "warning" as const;
  return "critical" as const;
}

export function phase46PerformanceScore(measurements: Phase46Measurement[]) {
  if (measurements.length === 0) return 0;
  const points = measurements.map((measurement) => {
    const status = getPhase46MetricStatus(measurement);
    return status === "healthy" ? 100 : status === "warning" ? 65 : status === "critical" ? 20 : 50;
  });
  return Math.round(points.reduce((sum, value) => sum + value, 0) / points.length);
}

export const PHASE46_CAPABILITIES = [
  "Virtualized template and asset rendering",
  "Memory-bounded thumbnail, asset, font, document, and render caches",
  "Priority-aware background task scheduling",
  "Compact undo and redo history",
  "Background autosave scheduling",
  "Lazy asset loading and prefetch hooks",
  "Performance budgets and measurements",
  "Startup, canvas, interaction, export, and memory diagnostics",
  "Thumbnail cache invalidation",
  "Incremental rendering helpers",
] as const;
