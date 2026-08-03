export type SecuritySeverity = "critical" | "high" | "medium" | "low";
export type SecurityControlStatus = "passed" | "warning" | "failed";
export type SecurityRole = "owner" | "administrator" | "security-admin" | "editor" | "reviewer" | "viewer";

export type SecurityPolicy = {
  id: string;
  name: string;
  category: "identity" | "data" | "sharing" | "publishing" | "device" | "retention";
  enabled: boolean;
  enforced: boolean;
  description: string;
};

export type SecurityEvent = {
  id: string;
  createdAt: string;
  severity: SecuritySeverity;
  category: string;
  message: string;
  actor?: string;
  resolved: boolean;
};

export type AccessMember = {
  id: string;
  name: string;
  email: string;
  role: SecurityRole;
  mfaEnabled: boolean;
  trustedDevice: boolean;
  lastActiveAt: string;
  suspended: boolean;
};

export type ComplianceFramework = {
  id: string;
  name: string;
  enabled: boolean;
  controls: number;
  passedControls: number;
};

export type EnterpriseSecurityWorkspace = {
  organizationName: string;
  members: AccessMember[];
  policies: SecurityPolicy[];
  events: SecurityEvent[];
  frameworks: ComplianceFramework[];
  settings: {
    requireMfa: boolean;
    requireTrustedDevices: boolean;
    encryptLocalProjects: boolean;
    encryptExports: boolean;
    watermarkExternalExports: boolean;
    blockPublicLinks: boolean;
    sessionTimeoutMinutes: number;
    retentionDays: number;
    allowOfflineEditing: boolean;
  };
};

export type SecurityAuditIssue = {
  severity: SecuritySeverity;
  message: string;
  remediation: string;
};

export type SecurityAuditReport = {
  score: number;
  passed: number;
  warnings: number;
  failed: number;
  protectedMembers: number;
  unresolvedEvents: number;
  complianceCoverage: number;
  issues: SecurityAuditIssue[];
};

const now = new Date().toISOString();

export const DEFAULT_ENTERPRISE_SECURITY_WORKSPACE: EnterpriseSecurityWorkspace = {
  organizationName: "Yaposan Enterprise Workspace",
  members: [
    { id: "m-owner", name: "Workspace Owner", email: "owner@yaposan.local", role: "owner", mfaEnabled: true, trustedDevice: true, lastActiveAt: now, suspended: false },
    { id: "m-admin", name: "Security Administrator", email: "security@yaposan.local", role: "security-admin", mfaEnabled: true, trustedDevice: true, lastActiveAt: now, suspended: false },
    { id: "m-editor", name: "Publishing Editor", email: "editor@yaposan.local", role: "editor", mfaEnabled: false, trustedDevice: true, lastActiveAt: now, suspended: false },
  ],
  policies: [
    { id: "p-mfa", name: "Multi-factor authentication", category: "identity", enabled: true, enforced: true, description: "Require MFA for privileged and publishing roles." },
    { id: "p-encryption", name: "Project encryption", category: "data", enabled: true, enforced: true, description: "Encrypt project data and managed credentials." },
    { id: "p-sharing", name: "Restricted external sharing", category: "sharing", enabled: true, enforced: true, description: "Block anonymous public links and require approved recipients." },
    { id: "p-preflight", name: "Secure publishing gate", category: "publishing", enabled: true, enforced: true, description: "Require security and production preflight before release." },
    { id: "p-device", name: "Trusted device access", category: "device", enabled: true, enforced: false, description: "Limit sensitive projects to trusted devices." },
    { id: "p-retention", name: "Audit retention", category: "retention", enabled: true, enforced: true, description: "Retain security and publishing audit history." },
  ],
  events: [
    { id: "e-1", createdAt: now, severity: "medium", category: "identity", message: "Editor account does not have MFA enabled.", actor: "Publishing Editor", resolved: false },
    { id: "e-2", createdAt: now, severity: "low", category: "sharing", message: "External export watermark policy verified.", actor: "Security Administrator", resolved: true },
  ],
  frameworks: [
    { id: "f-soc2", name: "SOC 2 readiness", enabled: true, controls: 24, passedControls: 21 },
    { id: "f-gdpr", name: "GDPR privacy controls", enabled: true, controls: 18, passedControls: 17 },
    { id: "f-iso", name: "ISO 27001 readiness", enabled: true, controls: 32, passedControls: 27 },
  ],
  settings: {
    requireMfa: true,
    requireTrustedDevices: false,
    encryptLocalProjects: true,
    encryptExports: false,
    watermarkExternalExports: true,
    blockPublicLinks: true,
    sessionTimeoutMinutes: 60,
    retentionDays: 365,
    allowOfflineEditing: true,
  },
};

export function setMemberSuspended(workspace: EnterpriseSecurityWorkspace, memberId: string, suspended: boolean): EnterpriseSecurityWorkspace {
  return {
    ...workspace,
    members: workspace.members.map((member) => member.id === memberId ? { ...member, suspended } : member),
  };
}

export function resolveSecurityEvent(workspace: EnterpriseSecurityWorkspace, eventId: string): EnterpriseSecurityWorkspace {
  return {
    ...workspace,
    events: workspace.events.map((event) => event.id === eventId ? { ...event, resolved: true } : event),
  };
}

export function auditEnterpriseSecurity(workspace: EnterpriseSecurityWorkspace): SecurityAuditReport {
  const issues: SecurityAuditIssue[] = [];
  const activeMembers = workspace.members.filter((member) => !member.suspended);
  const protectedMembers = activeMembers.filter((member) => member.mfaEnabled && (!workspace.settings.requireTrustedDevices || member.trustedDevice)).length;
  const unresolvedEvents = workspace.events.filter((event) => !event.resolved).length;

  if (workspace.settings.requireMfa) {
    const missingMfa = activeMembers.filter((member) => !member.mfaEnabled);
    if (missingMfa.length) issues.push({ severity: "high", message: `${missingMfa.length} active member(s) do not have MFA enabled.`, remediation: "Require MFA before allowing editing, administration, or publishing." });
  }
  if (!workspace.settings.encryptLocalProjects) issues.push({ severity: "critical", message: "Local project encryption is disabled.", remediation: "Enable project-at-rest encryption for managed enterprise workspaces." });
  if (!workspace.settings.blockPublicLinks) issues.push({ severity: "high", message: "Anonymous public links are allowed.", remediation: "Require authenticated, expiring links for external sharing." });
  if (!workspace.settings.watermarkExternalExports) issues.push({ severity: "medium", message: "External export watermarking is disabled.", remediation: "Apply configurable watermarks to review and external distribution exports." });
  if (workspace.settings.sessionTimeoutMinutes > 240) issues.push({ severity: "medium", message: "Session timeout exceeds four hours.", remediation: "Reduce privileged-session duration." });
  if (workspace.settings.retentionDays < 90) issues.push({ severity: "medium", message: "Audit retention is below 90 days.", remediation: "Increase audit retention to meet organizational policy." });

  for (const policy of workspace.policies) {
    if (policy.enabled && !policy.enforced) issues.push({ severity: "low", message: `${policy.name} is enabled but not enforced.`, remediation: "Move the policy to enforced mode after validation." });
  }

  const controls = workspace.frameworks.filter((framework) => framework.enabled);
  const controlTotal = controls.reduce((sum, item) => sum + item.controls, 0);
  const controlPassed = controls.reduce((sum, item) => sum + item.passedControls, 0);
  const complianceCoverage = controlTotal ? Math.round((controlPassed / controlTotal) * 100) : 0;
  const deductions = issues.reduce((sum, issue) => sum + ({ critical: 30, high: 18, medium: 9, low: 3 }[issue.severity]), 0);
  const score = Math.max(0, Math.min(100, 100 - deductions));
  const failed = issues.filter((issue) => issue.severity === "critical" || issue.severity === "high").length;
  const warnings = issues.length - failed;
  return { score, passed: Math.max(0, workspace.policies.length - issues.length), warnings, failed, protectedMembers, unresolvedEvents, complianceCoverage, issues };
}
