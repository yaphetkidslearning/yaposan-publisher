import type { DesktopUpdatePolicy, DesktopUpdateStatus } from "../utils/desktopUpdateEngine";
import type { TelemetryConsent, TelemetryEvent, TelemetrySnapshot } from "../utils/telemetryDiagnosticsEngine";
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
