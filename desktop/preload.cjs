const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("yaposanDesktop", Object.freeze({
  getDesktopInfo: () => ipcRenderer.invoke("yaposan:desktop-info"),
  verifyArtifact: (filePath) => ipcRenderer.invoke("yaposan:verify-artifact", filePath),
  selectReleaseDirectory: () => ipcRenderer.invoke("yaposan:select-release-directory"),
  offline: Object.freeze({
    getSnapshot: () => ipcRenderer.invoke("yaposan:offline-snapshot"),
    saveProject: (input) => ipcRenderer.invoke("yaposan:offline-save-project", input),
    loadProject: (projectId) => ipcRenderer.invoke("yaposan:offline-load-project", projectId),
    removeProject: (projectId) => ipcRenderer.invoke("yaposan:offline-remove-project", projectId),
    queueOperation: (input) => ipcRenderer.invoke("yaposan:offline-queue-operation", input),
    resolveOperation: (input) => ipcRenderer.invoke("yaposan:offline-resolve-operation", input),
    exportBackup: () => ipcRenderer.invoke("yaposan:offline-export-backup"),
    subscribe: (listener) => { const handler = (_event, snapshot) => listener(snapshot); ipcRenderer.on("yaposan:offline-status", handler); return () => ipcRenderer.removeListener("yaposan:offline-status", handler); },
  }),
  telemetry: Object.freeze({
    getSnapshot: () => ipcRenderer.invoke("yaposan:telemetry-snapshot"),
    setConsent: (consent) => ipcRenderer.invoke("yaposan:telemetry-consent", consent),
    record: (event) => ipcRenderer.invoke("yaposan:telemetry-record", event),
    clear: () => ipcRenderer.invoke("yaposan:telemetry-clear"),
    exportReport: () => ipcRenderer.invoke("yaposan:telemetry-export"),
  }),
  updates: Object.freeze({
    getStatus: () => ipcRenderer.invoke("yaposan:update-status"),
    check: () => ipcRenderer.invoke("yaposan:update-check"),
    download: () => ipcRenderer.invoke("yaposan:update-download"),
    install: () => ipcRenderer.invoke("yaposan:update-install"),
    setPolicy: (policy) => ipcRenderer.invoke("yaposan:update-policy", policy),
    subscribe: (listener) => { const handler = (_event, status) => listener(status); ipcRenderer.on("yaposan:update-status", handler); return () => ipcRenderer.removeListener("yaposan:update-status", handler); },
  }),
}));
