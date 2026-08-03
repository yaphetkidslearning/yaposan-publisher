export type OperationsSeverity = "critical" | "high" | "medium" | "low";
export type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export type OperationsService = { id: string; name: string; status: ServiceStatus; latencyMs: number; lastCheckedAt: string };
export type OperationsJob = { id: string; name: string; category: string; status: JobStatus; progress: number; retries: number; createdAt: string };
export type RecoveryPoint = { id: string; name: string; createdAt: string; verified: boolean; sizeMb: number };
export type CertificationFinding = { severity: OperationsSeverity; area: string; message: string; remediation: string };
export type EnterpriseOperationsWorkspace = {
  services: OperationsService[];
  jobs: OperationsJob[];
  recoveryPoints: RecoveryPoint[];
  metrics: { memoryMb: number; cacheMb: number; storageMb: number; startupMs: number; aiRequests: number; estimatedAiCost: number };
  settings: { autoRecovery: boolean; backgroundDiagnostics: boolean; cacheLimitMb: number; storageWarningMb: number; retainReportsDays: number };
};
export type ProductionCertificationReport = { score: number; passedAreas: number; warnings: number; failed: number; operationalServices: number; failedJobs: number; verifiedBackups: number; findings: CertificationFinding[] };

const now = new Date().toISOString();
export const DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE: EnterpriseOperationsWorkspace = {
  services: [
    { id: "editor", name: "Editor Runtime", status: "operational", latencyMs: 24, lastCheckedAt: now },
    { id: "export", name: "Export Engine", status: "operational", latencyMs: 118, lastCheckedAt: now },
    { id: "assets", name: "Asset Service", status: "operational", latencyMs: 62, lastCheckedAt: now },
    { id: "automation", name: "Workflow Automation", status: "degraded", latencyMs: 440, lastCheckedAt: now },
    { id: "integrations", name: "Integration Gateway", status: "operational", latencyMs: 136, lastCheckedAt: now },
  ],
  jobs: [
    { id: "job-1", name: "Production PDF export", category: "publishing", status: "completed", progress: 100, retries: 0, createdAt: now },
    { id: "job-2", name: "Asset integrity scan", category: "diagnostics", status: "running", progress: 72, retries: 0, createdAt: now },
    { id: "job-3", name: "Marketplace sync", category: "integration", status: "failed", progress: 41, retries: 2, createdAt: now },
  ],
  recoveryPoints: [
    { id: "rp-1", name: "Pre-release checkpoint", createdAt: now, verified: true, sizeMb: 84 },
    { id: "rp-2", name: "Latest automatic backup", createdAt: now, verified: false, sizeMb: 86 },
  ],
  metrics: { memoryMb: 612, cacheMb: 148, storageMb: 1840, startupMs: 1620, aiRequests: 184, estimatedAiCost: 3.68 },
  settings: { autoRecovery: true, backgroundDiagnostics: true, cacheLimitMb: 256, storageWarningMb: 5000, retainReportsDays: 365 },
};

export function retryOperationsJob(workspace: EnterpriseOperationsWorkspace, jobId: string): EnterpriseOperationsWorkspace {
  return { ...workspace, jobs: workspace.jobs.map((job) => job.id === jobId ? { ...job, status: "queued", progress: 0, retries: job.retries + 1 } : job) };
}
export function verifyRecoveryPoint(workspace: EnterpriseOperationsWorkspace, pointId: string): EnterpriseOperationsWorkspace {
  return { ...workspace, recoveryPoints: workspace.recoveryPoints.map((point) => point.id === pointId ? { ...point, verified: true } : point) };
}
export function optimizeEnterpriseWorkspace(workspace: EnterpriseOperationsWorkspace): EnterpriseOperationsWorkspace {
  return { ...workspace, metrics: { ...workspace.metrics, memoryMb: Math.max(256, Math.round(workspace.metrics.memoryMb * 0.82)), cacheMb: Math.round(workspace.metrics.cacheMb * 0.35), startupMs: Math.round(workspace.metrics.startupMs * 0.78) } };
}
export function certifyEnterpriseProduction(workspace: EnterpriseOperationsWorkspace): ProductionCertificationReport {
  const findings: CertificationFinding[] = [];
  workspace.services.forEach((service) => {
    if (service.status === "outage") findings.push({ severity: "critical", area: service.name, message: "Service outage detected.", remediation: "Restore the service before production release." });
    else if (service.status === "degraded" || service.latencyMs > 500) findings.push({ severity: "medium", area: service.name, message: "Service performance is degraded.", remediation: "Review diagnostics and reduce latency before high-volume publishing." });
  });
  const failedJobs = workspace.jobs.filter((job) => job.status === "failed").length;
  if (failedJobs) findings.push({ severity: "high", area: "Background Jobs", message: `${failedJobs} background job(s) failed.`, remediation: "Retry failed jobs and verify connector credentials or export settings." });
  const unverified = workspace.recoveryPoints.filter((point) => !point.verified).length;
  if (unverified) findings.push({ severity: "high", area: "Recovery", message: `${unverified} recovery point(s) are not verified.`, remediation: "Verify restore points before certification." });
  if (workspace.metrics.cacheMb > workspace.settings.cacheLimitMb) findings.push({ severity: "low", area: "Performance", message: "Cache usage exceeds the configured limit.", remediation: "Run cache cleanup and asset optimization." });
  if (workspace.metrics.storageMb > workspace.settings.storageWarningMb) findings.push({ severity: "medium", area: "Storage", message: "Storage usage exceeds the warning threshold.", remediation: "Archive old exports and temporary assets." });
  if (!workspace.settings.autoRecovery) findings.push({ severity: "medium", area: "Recovery", message: "Automatic recovery is disabled.", remediation: "Enable automatic recovery for production workspaces." });
  const deduction = findings.reduce((sum, item) => sum + ({ critical: 30, high: 18, medium: 9, low: 3 }[item.severity]), 0);
  const failed = findings.filter((item) => item.severity === "critical" || item.severity === "high").length;
  return { score: Math.max(0, 100 - deduction), passedAreas: Math.max(0, 11 - findings.length), warnings: findings.length - failed, failed, operationalServices: workspace.services.filter((s) => s.status === "operational").length, failedJobs, verifiedBackups: workspace.recoveryPoints.filter((p) => p.verified).length, findings };
}
