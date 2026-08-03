export type TelemetryCategory = "crash" | "performance" | "usage";
export type TelemetryConsent = {
  enabled: boolean;
  crashReports: boolean;
  performanceMetrics: boolean;
  anonymousUsage: boolean;
  updatedAt: number;
};
export type TelemetryEvent = {
  id: string;
  category: TelemetryCategory;
  name: string;
  timestamp: number;
  durationMs?: number;
  properties?: Record<string, string | number | boolean>;
};
export type TelemetrySnapshot = {
  consent: TelemetryConsent;
  queuedEvents: number;
  recentEvents: TelemetryEvent[];
  sessionId: string;
  storage: "desktop" | "browser-memory";
};

export const DEFAULT_TELEMETRY_CONSENT: TelemetryConsent = {
  enabled: false,
  crashReports: false,
  performanceMetrics: false,
  anonymousUsage: false,
  updatedAt: 0,
};

const sessionId = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
let browserConsent = { ...DEFAULT_TELEMETRY_CONSENT };
let browserEvents: TelemetryEvent[] = [];

function desktopTelemetry() {
  return typeof window !== "undefined" ? window.yaposanDesktop?.telemetry : undefined;
}
export function telemetryAvailable(): boolean { return Boolean(desktopTelemetry()); }
export async function getTelemetrySnapshot(): Promise<TelemetrySnapshot> {
  const desktop = desktopTelemetry();
  if (desktop) return desktop.getSnapshot();
  return { consent: browserConsent, queuedEvents: browserEvents.length, recentEvents: browserEvents.slice(-50).reverse(), sessionId, storage: "browser-memory" };
}
export async function setTelemetryConsent(consent: Omit<TelemetryConsent, "updatedAt">): Promise<TelemetrySnapshot> {
  const next = { ...consent, updatedAt: Date.now() };
  const desktop = desktopTelemetry();
  if (desktop) return desktop.setConsent(next);
  browserConsent = next;
  if (!next.enabled) browserEvents = [];
  return getTelemetrySnapshot();
}
export async function recordTelemetryEvent(event: Omit<TelemetryEvent, "id" | "timestamp">): Promise<boolean> {
  const desktop = desktopTelemetry();
  if (desktop) return desktop.record(event);
  const allowed = browserConsent.enabled && ((event.category === "crash" && browserConsent.crashReports) || (event.category === "performance" && browserConsent.performanceMetrics) || (event.category === "usage" && browserConsent.anonymousUsage));
  if (!allowed) return false;
  browserEvents.push({ ...event, id: `${sessionId}-${browserEvents.length + 1}`, timestamp: Date.now() });
  browserEvents = browserEvents.slice(-500);
  return true;
}
export async function clearTelemetryData(): Promise<TelemetrySnapshot> {
  const desktop = desktopTelemetry();
  if (desktop) return desktop.clear();
  browserEvents = [];
  return getTelemetrySnapshot();
}
export async function exportTelemetryReport(): Promise<string> {
  const desktop = desktopTelemetry();
  if (desktop) return desktop.exportReport();
  return JSON.stringify({ generatedAt: new Date().toISOString(), ...await getTelemetrySnapshot() }, null, 2);
}
export async function measureTelemetry<T>(name: string, task: () => Promise<T> | T, properties?: Record<string, string | number | boolean>): Promise<T> {
  const start = Date.now();
  try { return await task(); }
  finally { void recordTelemetryEvent({ category: "performance", name, durationMs: Date.now() - start, properties }); }
}
