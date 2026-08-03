export type IntegrationCategory = "cloud-storage" | "commerce" | "productivity" | "identity" | "analytics" | "publishing";
export type IntegrationStatus = "connected" | "attention" | "disconnected" | "disabled";
export type SyncDirection = "push" | "pull" | "bidirectional";

export type EnterpriseConnector = {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  syncDirection: SyncDirection;
  endpoint?: string;
  lastSyncAt?: number;
  scopes: string[];
  encryptedCredentials: boolean;
  enabled: boolean;
  retryLimit: number;
};

export type IntegrationJob = {
  id: string;
  connectorId: string;
  operation: "publish" | "import" | "export" | "sync" | "webhook";
  status: "queued" | "running" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  recordsProcessed: number;
  error?: string;
};

export type WebhookSubscription = {
  id: string;
  name: string;
  event: "project.saved" | "project.published" | "asset.added" | "review.approved" | "export.completed";
  targetUrl: string;
  active: boolean;
  secretConfigured: boolean;
  failureCount: number;
};

export type IntegrationWorkspace = {
  connectors: EnterpriseConnector[];
  jobs: IntegrationJob[];
  webhooks: WebhookSubscription[];
  allowExternalConnections: boolean;
  requireEncryptedCredentials: boolean;
  requireAdminApproval: boolean;
  auditRetentionDays: number;
};

export type IntegrationAudit = {
  score: number;
  connected: number;
  attention: number;
  activeWebhooks: number;
  successfulJobs: number;
  failedJobs: number;
  issues: Array<{ severity: "error" | "warning" | "info"; message: string; remediation: string }>;
};

const now = Date.now();
export const DEFAULT_ENTERPRISE_INTEGRATION_WORKSPACE: IntegrationWorkspace = {
  allowExternalConnections: true,
  requireEncryptedCredentials: true,
  requireAdminApproval: true,
  auditRetentionDays: 365,
  connectors: [
    { id: "onedrive", name: "Microsoft OneDrive", category: "cloud-storage", status: "connected", syncDirection: "bidirectional", lastSyncAt: now - 1000 * 60 * 12, scopes: ["files.readwrite", "offline_access"], encryptedCredentials: true, enabled: true, retryLimit: 3 },
    { id: "google-drive", name: "Google Drive", category: "cloud-storage", status: "attention", syncDirection: "bidirectional", lastSyncAt: now - 1000 * 60 * 60 * 7, scopes: ["drive.file"], encryptedCredentials: true, enabled: true, retryLimit: 3 },
    { id: "shopify", name: "Shopify", category: "commerce", status: "connected", syncDirection: "push", lastSyncAt: now - 1000 * 60 * 38, scopes: ["write_products", "write_files"], encryptedCredentials: true, enabled: true, retryLimit: 5 },
    { id: "adobe-stock", name: "Stock Asset Provider", category: "publishing", status: "disconnected", syncDirection: "pull", scopes: ["assets.read"], encryptedCredentials: true, enabled: false, retryLimit: 3 },
  ],
  jobs: [
    { id: "job-1", connectorId: "onedrive", operation: "sync", status: "completed", createdAt: now - 1000 * 60 * 15, completedAt: now - 1000 * 60 * 12, recordsProcessed: 42 },
    { id: "job-2", connectorId: "shopify", operation: "publish", status: "completed", createdAt: now - 1000 * 60 * 41, completedAt: now - 1000 * 60 * 38, recordsProcessed: 8 },
    { id: "job-3", connectorId: "google-drive", operation: "sync", status: "failed", createdAt: now - 1000 * 60 * 60 * 7, completedAt: now - 1000 * 60 * 60 * 7, recordsProcessed: 0, error: "Authorization requires renewal" },
  ],
  webhooks: [
    { id: "hook-1", name: "Publishing completed", event: "project.published", targetUrl: "https://integrations.example/hooks/published", active: true, secretConfigured: true, failureCount: 0 },
    { id: "hook-2", name: "Review approval", event: "review.approved", targetUrl: "https://integrations.example/hooks/approved", active: true, secretConfigured: true, failureCount: 1 },
  ],
};

export function registerConnector(workspace: IntegrationWorkspace, connector: EnterpriseConnector): IntegrationWorkspace {
  if (!connector.id.trim() || !connector.name.trim()) throw new Error("Connector id and name are required");
  if (workspace.requireEncryptedCredentials && !connector.encryptedCredentials) throw new Error("Encrypted credentials are required");
  return { ...workspace, connectors: [...workspace.connectors.filter((item) => item.id !== connector.id), connector] };
}

export function queueIntegrationJob(workspace: IntegrationWorkspace, connectorId: string, operation: IntegrationJob["operation"]): IntegrationWorkspace {
  const connector = workspace.connectors.find((item) => item.id === connectorId);
  if (!connector || !connector.enabled || connector.status === "disabled") throw new Error("Connector is not available");
  const job: IntegrationJob = { id: `job-${Date.now()}`, connectorId, operation, status: "queued", createdAt: Date.now(), recordsProcessed: 0 };
  return { ...workspace, jobs: [job, ...workspace.jobs] };
}

export function completeIntegrationJob(workspace: IntegrationWorkspace, jobId: string, recordsProcessed: number): IntegrationWorkspace {
  return { ...workspace, jobs: workspace.jobs.map((job) => job.id === jobId ? { ...job, status: "completed", completedAt: Date.now(), recordsProcessed: Math.max(0, recordsProcessed), error: undefined } : job) };
}

export function auditEnterpriseIntegrations(workspace: IntegrationWorkspace): IntegrationAudit {
  const issues: IntegrationAudit["issues"] = [];
  const connected = workspace.connectors.filter((item) => item.enabled && item.status === "connected").length;
  const attention = workspace.connectors.filter((item) => item.status === "attention").length;
  const successfulJobs = workspace.jobs.filter((item) => item.status === "completed").length;
  const failedJobs = workspace.jobs.filter((item) => item.status === "failed").length;
  const activeWebhooks = workspace.webhooks.filter((item) => item.active).length;
  if (!workspace.requireEncryptedCredentials) issues.push({ severity: "error", message: "Credential encryption is not enforced.", remediation: "Require encrypted credentials for every connector." });
  if (!workspace.requireAdminApproval) issues.push({ severity: "warning", message: "Connectors can be activated without administrator approval.", remediation: "Enable administrator approval for external integrations." });
  workspace.connectors.filter((item) => item.enabled && !item.encryptedCredentials).forEach((item) => issues.push({ severity: "error", message: `${item.name} stores credentials without encryption.`, remediation: "Move secrets to the secure credential vault." }));
  workspace.connectors.filter((item) => item.status === "attention").forEach((item) => issues.push({ severity: "warning", message: `${item.name} requires attention.`, remediation: "Renew authorization and run a connection test." }));
  workspace.webhooks.filter((item) => item.active && !item.secretConfigured).forEach((item) => issues.push({ severity: "error", message: `${item.name} does not have a signing secret.`, remediation: "Configure HMAC signing before enabling the webhook." }));
  if (failedJobs > 0) issues.push({ severity: "warning", message: `${failedJobs} integration job${failedJobs === 1 ? " has" : "s have"} failed.`, remediation: "Review job logs and retry after correcting connector settings." });
  const penalty = issues.reduce((total, issue) => total + (issue.severity === "error" ? 18 : issue.severity === "warning" ? 8 : 2), 0);
  return { score: Math.max(0, 100 - penalty), connected, attention, activeWebhooks, successfulJobs, failedJobs, issues };
}
