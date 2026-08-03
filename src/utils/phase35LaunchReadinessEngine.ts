export type Phase35Module = { id: string; title: string; description: string; features: string[] };
export type ReadinessStatus = "not-started" | "in-progress" | "blocked" | "passed";
export type ReadinessCheck = { id: string; moduleId: string; title: string; owner: string; status: ReadinessStatus; evidence?: string; updatedAt: string };
export type IncidentSeverity = "sev1" | "sev2" | "sev3" | "sev4";
export type Incident = { id: string; title: string; severity: IncidentSeverity; status: "open" | "monitoring" | "resolved"; service: string; createdAt: string };

export const PHASE35_MODULES: Phase35Module[] = [
  { id: "35.0", title: "Configuration & Secret Management", description: "Centralized environment validation, secret references, feature flags and safe release configuration.", features: ["Environment schema", "Secret reference registry", "Feature flags", "Configuration drift checks", "Safe defaults"] },
  { id: "35.1", title: "Privacy, Consent & Data Rights", description: "Consent records and privacy operations for export, deletion, retention and account lifecycle requests.", features: ["Consent ledger", "Data export request", "Deletion request", "Retention rules", "Cookie preferences"] },
  { id: "35.2", title: "Observability & Incident Response", description: "Service health, structured telemetry, alert routing, incidents, status history and postmortem readiness.", features: ["Health checks", "Metrics registry", "Alert policies", "Incident timeline", "Postmortem template"] },
  { id: "35.3", title: "Backup & Disaster Recovery", description: "Backup policies, restore verification, recovery objectives and regional failover planning.", features: ["Automated backups", "Restore drills", "RPO and RTO targets", "Failover runbooks", "Recovery audit"] },
  { id: "35.4", title: "Localization & Internationalization", description: "Locale catalogs, formatting rules, translation coverage and right-to-left readiness.", features: ["Locale registry", "Translation catalog", "Currency and date formats", "RTL readiness", "Missing-string audit"] },
  { id: "35.5", title: "Accessibility Quality Center", description: "Production accessibility checks for keyboard, screen reader, contrast, focus and motion preferences.", features: ["Keyboard navigation", "Screen-reader labels", "Contrast audit", "Focus management", "Reduced motion"] },
  { id: "35.6", title: "Migration & Import Center", description: "Controlled migration from legacy design and publishing tools with validation and rollback.", features: ["Project import", "Asset import", "Template migration", "Validation reports", "Rollback checkpoints"] },
  { id: "35.7", title: "Support & Customer Operations", description: "Support tickets, diagnostics bundles, service notices, account assistance and escalation workflows.", features: ["Support inbox", "Diagnostic bundles", "Account recovery workflow", "Escalation policies", "Service notices"] },
  { id: "35.8", title: "Developer Platform & API Governance", description: "API keys, webhooks, scopes, rate policies, SDK metadata and developer documentation contracts.", features: ["API key registry", "Webhook subscriptions", "OAuth scopes", "Rate policies", "SDK manifests"] },
  { id: "35.9", title: "Release Governance & Feature Rollout", description: "Controlled rollouts with approvals, cohorts, canaries, rollback triggers and release evidence.", features: ["Release approvals", "Canary cohorts", "Progressive rollout", "Rollback triggers", "Evidence archive"] },
  { id: "35.10", title: "Legal & Compliance Center", description: "Policy versions, licensing records, vendor reviews, data processing terms and compliance evidence.", features: ["Terms and privacy versions", "Open-source notices", "Vendor register", "DPA records", "Compliance evidence"] },
  { id: "35.11", title: "Launch Operations Center", description: "Launch-day command center for readiness, ownership, communications and go/no-go control.", features: ["Launch checklist", "Owner matrix", "Communication plan", "Go/no-go review", "War-room timeline"] },
  { id: "35.12", title: "Final Platform Certification", description: "Cross-phase validation and evidence-based certification for a production launch candidate.", features: ["Cross-phase regression", "Security review", "Recovery verification", "Accessibility sign-off", "Release certification"] },
];

export const DEFAULT_READINESS_CHECKS: ReadinessCheck[] = PHASE35_MODULES.map((module) => ({
  id: `check-${module.id}`,
  moduleId: module.id,
  title: `${module.title} baseline review`,
  owner: module.id === "35.12" ? "Release Manager" : "Platform Team",
  status: "not-started",
  updatedAt: new Date(0).toISOString(),
}));

export function updateReadiness(check: ReadinessCheck, status: ReadinessStatus, evidence?: string): ReadinessCheck {
  return { ...check, status, evidence: evidence ?? check.evidence, updatedAt: new Date().toISOString() };
}

export function readinessScore(checks: ReadinessCheck[]): number {
  if (!checks.length) return 0;
  const weights: Record<ReadinessStatus, number> = { "not-started": 0, "in-progress": 0.5, blocked: 0.25, passed: 1 };
  return Math.round((checks.reduce((sum, check) => sum + weights[check.status], 0) / checks.length) * 100);
}

export function createIncident(title: string, service: string, severity: IncidentSeverity = "sev3"): Incident {
  return { id: `incident-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, service, severity, status: "open", createdAt: new Date().toISOString() };
}

export function validateEnvironment(values: Record<string, string | undefined>, required: string[]): { valid: boolean; missing: string[] } {
  const missing = required.filter((key) => !values[key]?.trim());
  return { valid: missing.length === 0, missing };
}
