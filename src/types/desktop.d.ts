import type { DesktopUpdatePolicy, DesktopUpdateStatus } from "../utils/desktopUpdateEngine";
import type { TelemetryConsent, TelemetryEvent, TelemetrySnapshot } from "../utils/telemetryDiagnosticsEngine";
import type { DesktopOfflineSnapshot, OfflineProjectRecord } from "../utils/desktopOfflineSyncEngine";
export {};
declare global {
  interface Window {
    yaposanDesktop?: {
      getDesktopInfo(): Promise<{ appName: string; version: string; platform: string; arch: string; packaged: boolean; userDataPath: string }>;
      verifyArtifact(filePath: string): Promise<{ filePath: string; bytes: number; sha256: string }>;
      selectReleaseDirectory(): Promise<string | null>;
      telemetry: {
        getSnapshot(): Promise<TelemetrySnapshot>;
        setConsent(consent: TelemetryConsent): Promise<TelemetrySnapshot>;
        record(event: Omit<TelemetryEvent, "id" | "timestamp">): Promise<boolean>;
        clear(): Promise<TelemetrySnapshot>;
        exportReport(): Promise<string>;
      };
      offline: {
        getSnapshot(): Promise<DesktopOfflineSnapshot>;
        saveProject(input: { projectId: string; name: string; payload: unknown; revision?: number }): Promise<OfflineProjectRecord>;
        loadProject(projectId: string): Promise<{ metadata: OfflineProjectRecord; payload: unknown } | null>;
        removeProject(projectId: string): Promise<boolean>;
        queueOperation(input: { projectId: string; type: "create" | "update" | "delete"; payload?: unknown }): Promise<DesktopOfflineSnapshot>;
        resolveOperation(input: { operationId: string; success: boolean; error?: string }): Promise<DesktopOfflineSnapshot>;
        exportBackup(): Promise<{ canceled: boolean; filePath?: string }>;
        subscribe(listener: (snapshot: DesktopOfflineSnapshot) => void): () => void;
      };
      updates: {
        getStatus(): Promise<DesktopUpdateStatus>;
        check(): Promise<DesktopUpdateStatus>;
        download(): Promise<DesktopUpdateStatus>;
        install(): Promise<void>;
        setPolicy(policy: DesktopUpdatePolicy): Promise<DesktopUpdateStatus>;
        subscribe(listener: (status: DesktopUpdateStatus) => void): () => void;
      };
    };
  }
}
