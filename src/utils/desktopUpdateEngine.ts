export type UpdateChannel = "stable" | "beta" | "development";
export type UpdateState = "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
export type DesktopUpdateStatus = {
  state: UpdateState;
  currentVersion: string;
  availableVersion?: string;
  channel: UpdateChannel;
  progress?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  releaseName?: string;
  releaseNotes?: string;
  error?: string;
  checkedAt?: number;
};
export type DesktopUpdatePolicy = {
  channel: UpdateChannel;
  automaticChecks: boolean;
  automaticDownload: boolean;
  installOnQuit: boolean;
};

export const DEFAULT_UPDATE_POLICY: DesktopUpdatePolicy = {
  channel: "stable",
  automaticChecks: true,
  automaticDownload: false,
  installOnQuit: true,
};

export function desktopUpdaterAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.yaposanDesktop?.updates);
}

export async function getDesktopUpdateStatus(): Promise<DesktopUpdateStatus> {
  if (!window.yaposanDesktop?.updates) {
    return { state: "idle", currentVersion: "web", channel: "stable", error: "Desktop updates are available only in the installed desktop application." };
  }
  return window.yaposanDesktop.updates.getStatus();
}

export async function checkForDesktopUpdates(): Promise<DesktopUpdateStatus> {
  if (!window.yaposanDesktop?.updates) return getDesktopUpdateStatus();
  return window.yaposanDesktop.updates.check();
}

export async function downloadDesktopUpdate(): Promise<DesktopUpdateStatus> {
  if (!window.yaposanDesktop?.updates) return getDesktopUpdateStatus();
  return window.yaposanDesktop.updates.download();
}

export async function installDesktopUpdate(): Promise<void> {
  if (!window.yaposanDesktop?.updates) throw new Error("Desktop updater is unavailable.");
  await window.yaposanDesktop.updates.install();
}

export async function setDesktopUpdatePolicy(policy: DesktopUpdatePolicy): Promise<DesktopUpdateStatus> {
  if (!window.yaposanDesktop?.updates) return getDesktopUpdateStatus();
  return window.yaposanDesktop.updates.setPolicy(policy);
}

export function subscribeToDesktopUpdates(listener: (status: DesktopUpdateStatus) => void): () => void {
  return window.yaposanDesktop?.updates?.subscribe(listener) ?? (() => undefined);
}
