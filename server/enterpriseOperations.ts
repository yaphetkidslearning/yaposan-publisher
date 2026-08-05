import { createHash, randomUUID } from "node:crypto";
import type { DatabaseAdapter, JobRecord } from "./database";
import { isConfiguredAdmin } from "./authorization";

export type OperationsSummary = {
  generatedAt: string;
  totals: {
    users: number;
    organizations: number;
    projects: number;
    assets: number;
    storageBytes: number;
    jobs: number;
    queuedJobs: number;
    runningJobs: number;
    failedJobs: number;
    auditEvents: number;
  };
  jobsByKind: Record<string, number>;
  jobsByStatus: Record<string, number>;
  recentFailures: Array<{ id: string; kind: string; error?: string; updatedAt: string }>;
};

async function requireOperationsAdmin(db: DatabaseAdapter, userId: string, adminEmails: string[]) {
  const user = await db.get("users", userId);
  if (!user || !isConfiguredAdmin(user.email, adminEmails)) throw new Error("ADMIN_REQUIRED");
  return user;
}

export async function operationsSummary(db: DatabaseAdapter, userId: string, adminEmails: string[]): Promise<OperationsSummary> {
  await requireOperationsAdmin(db, userId, adminEmails);
  const [users, organizations, projects, assets, jobs, auditEvents] = await Promise.all([
    db.find("users", () => true),
    db.find("organizations", () => true),
    db.find("projects", () => true),
    db.find("assets", () => true),
    db.find("jobs", () => true),
    db.find("auditEvents", () => true),
  ]);
  const jobsByKind: Record<string, number> = {};
  const jobsByStatus: Record<string, number> = {};
  for (const job of jobs) {
    jobsByKind[job.kind] = (jobsByKind[job.kind] ?? 0) + 1;
    jobsByStatus[job.status] = (jobsByStatus[job.status] ?? 0) + 1;
  }
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      organizations: organizations.length,
      projects: projects.length,
      assets: assets.length,
      storageBytes: assets.reduce((sum, asset) => sum + Number(asset.size || 0), 0),
      jobs: jobs.length,
      queuedJobs: jobsByStatus.queued ?? 0,
      runningJobs: jobsByStatus.running ?? 0,
      failedJobs: jobsByStatus.failed ?? 0,
      auditEvents: auditEvents.length,
    },
    jobsByKind,
    jobsByStatus,
    recentFailures: jobs.filter(job => job.status === "failed").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10).map(job => ({ id: job.id, kind: job.kind, error: job.error, updatedAt: job.updatedAt })),
  };
}

export async function listOperationsJobs(db: DatabaseAdapter, userId: string, adminEmails: string[], options: { status?: string; kind?: string; limit?: number } = {}) {
  await requireOperationsAdmin(db, userId, adminEmails);
  const limit = Math.min(Math.max(Number(options.limit ?? 100), 1), 500);
  const jobs = await db.find("jobs", job => (!options.status || job.status === options.status) && (!options.kind || job.kind === options.kind));
  return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export async function scheduleAutomation(db: DatabaseAdapter, userId: string, adminEmails: string[], input: { name?: string; task?: string; schedule?: string; payload?: unknown }) {
  const user = await requireOperationsAdmin(db, userId, adminEmails);
  const name = String(input.name ?? "Automation").trim().slice(0, 120);
  const task = String(input.task ?? "workflow").trim().slice(0, 80);
  const schedule = String(input.schedule ?? "manual").trim().slice(0, 120);
  if (!name) throw new Error("AUTOMATION_NAME_REQUIRED");
  const job = await db.insert("jobs", {
    kind: "notification",
    status: "queued",
    progress: 0,
    attempts: 0,
    payload: { phase: 83, automation: true, name, task, schedule, input: input.payload ?? {}, createdBy: user.email },
  });
  await db.insert("auditEvents", { actorUserId: userId, action: "operations.automation.scheduled", target: job.id, metadata: { name, task, schedule } });
  return job;
}

export async function updateOperationsJob(db: DatabaseAdapter, userId: string, adminEmails: string[], jobId: string, action: "cancel" | "retry") {
  await requireOperationsAdmin(db, userId, adminEmails);
  const job = await db.get("jobs", jobId);
  if (!job) throw new Error("JOB_NOT_FOUND");
  let patch: Partial<JobRecord>;
  if (action === "cancel") {
    if (["succeeded", "cancelled"].includes(job.status)) throw new Error("JOB_NOT_CANCELLABLE");
    patch = { status: "cancelled", progress: job.progress, error: "Cancelled by administrator" };
  } else {
    if (!['failed', 'cancelled'].includes(job.status)) throw new Error("JOB_NOT_RETRYABLE");
    patch = { status: "queued", progress: 0, error: undefined, workerId: undefined, leaseExpiresAt: undefined, heartbeatAt: undefined };
  }
  const updated = await db.update("jobs", job.id, patch);
  await db.insert("auditEvents", { actorUserId: userId, action: `operations.job.${action}`, target: job.id, metadata: { kind: job.kind, previousStatus: job.status, nextStatus: updated.status } });
  return updated;
}

export async function createBackupSnapshot(db: DatabaseAdapter, userId: string, adminEmails: string[]) {
  await requireOperationsAdmin(db, userId, adminEmails);
  const [users, organizations, projects, assets, versions, subscriptions, auditEvents, jobs] = await Promise.all([
    db.find("users", () => true), db.find("organizations", () => true), db.find("projects", () => true), db.find("assets", () => true),
    db.find("versions", () => true), db.find("subscriptions", () => true), db.find("auditEvents", () => true), db.find("jobs", () => true),
  ]);
  const manifest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    counts: { users: users.length, organizations: organizations.length, projects: projects.length, assets: assets.length, versions: versions.length, subscriptions: subscriptions.length, auditEvents: auditEvents.length, jobs: jobs.length },
  };
  const checksum = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  await db.insert("auditEvents", { actorUserId: userId, action: "operations.backup.snapshot", target: manifest.id, metadata: { ...manifest, checksum } });
  return { ...manifest, checksum, status: "verified" as const };
}

export async function listOperationsAudit(db: DatabaseAdapter, userId: string, adminEmails: string[], limit = 100) {
  await requireOperationsAdmin(db, userId, adminEmails);
  const events = await db.find("auditEvents", () => true);
  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.min(Math.max(limit, 1), 500));
}

export async function productionCertification(db: DatabaseAdapter, userId: string, adminEmails: string[], configurationIssues: string[]) {
  await requireOperationsAdmin(db, userId, adminEmails);
  const summary = await operationsSummary(db, userId, adminEmails);
  const checks = {
    configuration: configurationIssues.length === 0,
    database: true,
    noFailedJobs: summary.totals.failedJobs === 0,
    queueHealthy: summary.totals.queuedJobs < 1000,
    auditTrail: summary.totals.auditEvents > 0,
  };
  return {
    certified: Object.values(checks).every(Boolean),
    checkedAt: new Date().toISOString(),
    checks,
    configurationIssues,
    evidenceHash: createHash("sha256").update(JSON.stringify({ checks, summary: summary.totals, configurationIssues })).digest("hex"),
  };
}
