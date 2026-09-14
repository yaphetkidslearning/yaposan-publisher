export type Phase37Module = {
  id: string;
  title: string;
  description: string;
  features: string[];
  productionRequirements: string[];
};

export type InfrastructureStatus = "not-configured" | "configured" | "validating" | "ready" | "blocked";

export type InfrastructureCheck = {
  id: string;
  moduleId: string;
  title: string;
  status: InfrastructureStatus;
  owner: string;
  endpoint?: string;
  evidence?: string;
  lastCheckedAt?: string;
};

export type ServiceCredential = {
  id: string;
  provider: string;
  category: "database" | "storage" | "identity" | "ai" | "queue" | "monitoring" | "delivery";
  configured: boolean;
  environment: "development" | "staging" | "production";
};

export type DeploymentEnvironment = {
  id: "development" | "staging" | "production";
  label: string;
  region: string;
  status: "offline" | "provisioning" | "healthy" | "degraded";
  release: string;
};

export const PHASE37_MODULES: Phase37Module[] = [
  { id: "37.0", title: "Production Backend Foundation", description: "Typed API contracts, environment configuration, service boundaries and deployment-ready backend orchestration.", features: ["API gateway contracts", "Service registry", "Environment validation", "Health endpoints", "Configuration profiles"], productionRequirements: ["Deployed API runtime", "Production domain and TLS", "Managed secrets store"] },
  { id: "37.1", title: "Identity & Authentication", description: "Account, team and organization identity with OAuth, MFA, session governance and enterprise federation contracts.", features: ["User accounts", "Teams and organizations", "OAuth/OIDC", "MFA policy", "Session controls"], productionRequirements: ["Identity provider tenant", "OAuth client credentials", "Email verification service"] },
  { id: "37.2", title: "Cloud Data Platform", description: "Production data contracts for relational storage, cache, search and object storage with migration governance.", features: ["PostgreSQL schema", "Redis cache", "Search indexing", "Object storage", "Migration registry"], productionRequirements: ["Managed PostgreSQL", "Redis service", "S3-compatible storage"] },
  { id: "37.3", title: "Real AI Platform", description: "Provider-neutral AI routing, quotas, fallback policies, evaluation hooks and cost attribution.", features: ["Provider adapters", "Fallback routing", "Usage metering", "Prompt policy", "Model evaluation"], productionRequirements: ["Provider API keys", "Server-side proxy", "Billing and quota rules"] },
  { id: "37.4", title: "Collaboration Engine", description: "Presence, comments, shared cursors, document operations and conflict-resolution contracts for real-time teamwork.", features: ["Presence", "Live cursors", "Comments", "Operation log", "Conflict resolution"], productionRequirements: ["WebSocket service", "Shared operation store", "Multi-user load validation"] },
  { id: "37.5", title: "Background Processing", description: "Durable queues and workers for rendering, AI processing, exports, notifications and retries.", features: ["Durable queues", "Worker registry", "Retries and backoff", "Dead-letter queue", "Job observability"], productionRequirements: ["Queue broker", "Worker deployment", "Autoscaling policy"] },
  { id: "37.6", title: "Enterprise Security", description: "RBAC, audit, encryption, secret governance, retention and compliance evidence across the production platform.", features: ["RBAC", "Audit trail", "Encryption policy", "Secret rotation", "Retention controls"], productionRequirements: ["KMS or key vault", "Security review", "Penetration test"] },
  { id: "37.7", title: "Plugin SDK", description: "Versioned extension contracts, permissions, sandbox boundaries, packaging and compatibility validation.", features: ["Public SDK contracts", "Plugin manifest", "Permission model", "Sandbox policy", "Compatibility checks"], productionRequirements: ["Developer portal", "Signed package service", "Sandbox runtime"] },
  { id: "37.8", title: "Automation Platform", description: "Trigger-action workflows, schedules, webhook contracts, reusable templates and execution history.", features: ["Workflow definitions", "Triggers and actions", "Schedules", "Webhooks", "Execution history"], productionRequirements: ["Scheduler service", "Webhook ingress", "Credential vault"] },
  { id: "37.9", title: "Monitoring Platform", description: "Metrics, structured logs, traces, alert policies and service dashboards for every production component.", features: ["Metrics", "Logs", "Distributed traces", "Alerts", "Health dashboards"], productionRequirements: ["Telemetry backend", "Pager integration", "On-call rotation"] },
  { id: "37.10", title: "Disaster Recovery", description: "Backup, restore, replication, recovery objectives and tested continuity procedures.", features: ["Automated backups", "Restore workflow", "Replication", "RPO/RTO targets", "Recovery drills"], productionRequirements: ["Cross-region backup", "Restore test", "Business continuity approval"] },
  { id: "37.11", title: "Infrastructure Certification", description: "Load, security, failover, recovery and operational-readiness evidence before production approval.", features: ["Load testing", "Security testing", "Failover validation", "Recovery validation", "Operational sign-off"], productionRequirements: ["Independent test evidence", "Remediation closure", "Executive sign-off"] },
  { id: "37.12", title: "Production Infrastructure Complete", description: "Final consolidated certification for Packages 37.0-37.11 with traceable evidence and explicit external dependencies.", features: ["Readiness score", "Dependency register", "Evidence bundle", "Go-live decision", "certification"], productionRequirements: ["All critical checks ready", "No unresolved blockers", "Production credentials configured"] },
];

export const DEFAULT_INFRASTRUCTURE_CHECKS: InfrastructureCheck[] = PHASE37_MODULES.flatMap((module) =>
  module.productionRequirements.map((title, index) => ({
    id: `check-${module.id}-${index + 1}`,
    moduleId: module.id,
    title,
    status: "not-configured" as InfrastructureStatus,
    owner: module.id === "37.12" ? "Release Council" : "Platform Engineering",
  })),
);

export const DEFAULT_CREDENTIALS: ServiceCredential[] = [
  { id: "credential-database", provider: "PostgreSQL", category: "database", configured: false, environment: "production" },
  { id: "credential-storage", provider: "S3-compatible storage", category: "storage", configured: false, environment: "production" },
  { id: "credential-identity", provider: "OIDC identity provider", category: "identity", configured: false, environment: "production" },
  { id: "credential-ai", provider: "AI provider gateway", category: "ai", configured: false, environment: "production" },
  { id: "credential-queue", provider: "Queue broker", category: "queue", configured: false, environment: "production" },
  { id: "credential-monitoring", provider: "Telemetry platform", category: "monitoring", configured: false, environment: "production" },
];

export const DEFAULT_ENVIRONMENTS: DeploymentEnvironment[] = [
  { id: "development", label: "Development", region: "local", status: "healthy", release: "37.0.0-dev" },
  { id: "staging", label: "Staging", region: "not configured", status: "offline", release: "unassigned" },
  { id: "production", label: "Production", region: "not configured", status: "offline", release: "unassigned" },
];

export function updateInfrastructureCheck(check: InfrastructureCheck, status: InfrastructureStatus, evidence?: string): InfrastructureCheck {
  return { ...check, status, evidence: evidence ?? check.evidence, lastCheckedAt: new Date().toISOString() };
}

export function infrastructureReadinessScore(checks: InfrastructureCheck[]): number {
  if (!checks.length) return 0;
  const weights: Record<InfrastructureStatus, number> = { "not-configured": 0, blocked: 0, configured: 45, validating: 75, ready: 100 };
  return Math.round(checks.reduce((sum, check) => sum + weights[check.status], 0) / checks.length);
}

export function moduleReadiness(moduleId: string, checks: InfrastructureCheck[]): number {
  return infrastructureReadinessScore(checks.filter((check) => check.moduleId === moduleId));
}

export function productionBlockers(checks: InfrastructureCheck[], credentials: ServiceCredential[]): string[] {
  const blockers = checks.filter((check) => check.status === "blocked" || check.status === "not-configured").map((check) => `${check.moduleId}: ${check.title}`);
  const missingCredentials = credentials.filter((credential) => !credential.configured).map((credential) => `Credential: ${credential.provider}`);
  return [...blockers, ...missingCredentials];
}

export function certifyPhase37(checks: InfrastructureCheck[], credentials: ServiceCredential[]): { certified: boolean; score: number; blockers: string[] } {
  const score = infrastructureReadinessScore(checks);
  const blockers = productionBlockers(checks, credentials);
  return { certified: score === 100 && blockers.length === 0, score, blockers };
}
