export type OfflineProjectRecord = {
  projectId: string;
  name: string;
  updatedAt: number;
  revision: number;
  bytes: number;
  checksum: string;
  dirty: boolean;
};

export type OfflineSyncOperation = {
  id: string;
  projectId: string;
  type: "create" | "update" | "delete";
  createdAt: number;
  attempts: number;
  status: "queued" | "syncing" | "failed";
  lastError?: string;
};

export type DesktopOfflineSnapshot = {
  available: boolean;
  online: boolean;
  projects: OfflineProjectRecord[];
  queue: OfflineSyncOperation[];
  storageBytes: number;
  lastCheckedAt: number;
};

export type SyncConflict<T = unknown> = {
  projectId: string;
  localRevision: number;
  remoteRevision: number;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  localPayload: T;
  remotePayload: T;
};

export type ConflictResolution = "keep-local" | "keep-remote" | "duplicate-local";

export function chooseDefaultConflictResolution(conflict: Pick<SyncConflict, "localRevision" | "remoteRevision" | "localUpdatedAt" | "remoteUpdatedAt">): ConflictResolution {
  if (conflict.localRevision > conflict.remoteRevision) return "keep-local";
  if (conflict.remoteRevision > conflict.localRevision) return "keep-remote";
  return conflict.localUpdatedAt >= conflict.remoteUpdatedAt ? "keep-local" : "keep-remote";
}

export function applyConflictResolution<T>(conflict: SyncConflict<T>, resolution: ConflictResolution) {
  if (resolution === "keep-remote") return { action: "replace-local" as const, payload: conflict.remotePayload };
  if (resolution === "duplicate-local") return { action: "duplicate-local" as const, payload: conflict.localPayload, duplicateId: `${conflict.projectId}-offline-${conflict.localUpdatedAt}` };
  return { action: "upload-local" as const, payload: conflict.localPayload };
}

export function isDesktopOfflineAvailable() {
  return typeof window !== "undefined" && Boolean(window.yaposanDesktop?.offline);
}

function unavailable(): DesktopOfflineSnapshot {
  return { available: false, online: typeof navigator === "undefined" ? true : navigator.onLine, projects: [], queue: [], storageBytes: 0, lastCheckedAt: Date.now() };
}

export async function getDesktopOfflineSnapshot(): Promise<DesktopOfflineSnapshot> {
  return window.yaposanDesktop?.offline?.getSnapshot() ?? unavailable();
}

export async function saveDesktopOfflineProject(projectId: string, name: string, payload: unknown, revision = 1) {
  if (!window.yaposanDesktop?.offline) throw new Error("Desktop offline storage is unavailable in this browser.");
  return window.yaposanDesktop.offline.saveProject({ projectId, name, payload, revision });
}

export async function loadDesktopOfflineProject(projectId: string) {
  if (!window.yaposanDesktop?.offline) return null;
  return window.yaposanDesktop.offline.loadProject(projectId);
}

export async function removeDesktopOfflineProject(projectId: string) {
  if (!window.yaposanDesktop?.offline) return false;
  return window.yaposanDesktop.offline.removeProject(projectId);
}

export async function queueDesktopSyncOperation(projectId: string, type: OfflineSyncOperation["type"], payload?: unknown) {
  if (!window.yaposanDesktop?.offline) throw new Error("Desktop synchronization queue is unavailable.");
  return window.yaposanDesktop.offline.queueOperation({ projectId, type, payload });
}

export async function resolveDesktopSyncOperation(operationId: string, success: boolean, error?: string) {
  if (!window.yaposanDesktop?.offline) return unavailable();
  return window.yaposanDesktop.offline.resolveOperation({ operationId, success, error });
}

export function subscribeDesktopOffline(listener: (snapshot: DesktopOfflineSnapshot) => void) {
  return window.yaposanDesktop?.offline?.subscribe(listener) ?? (() => undefined);
}
