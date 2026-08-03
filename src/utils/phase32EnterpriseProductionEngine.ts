export type Phase32PackageId =
  | "32.0" | "32.1" | "32.2" | "32.3" | "32.4" | "32.5" | "32.6"
  | "32.7" | "32.8" | "32.9" | "32.10" | "32.11" | "32.12";

export type Phase32Module = { id: Phase32PackageId; title: string; description: string; features: string[] };
export type EnterpriseJobKind = "render" | "publish" | "print" | "automation" | "backup" | "approval";
export type EnterpriseJobStatus = "queued" | "running" | "paused" | "blocked" | "completed" | "failed" | "cancelled";
export type EnterpriseJob = { id: string; title: string; kind: EnterpriseJobKind; status: EnterpriseJobStatus; progress: number; owner: string; createdAt: string; priority: "low" | "normal" | "high" | "urgent"; target?: string };
export type Collaborator = { id: string; name: string; role: "owner" | "admin" | "editor" | "reviewer" | "viewer"; presence: "online" | "away" | "offline"; cursor?: { pageId: string; x: number; y: number } };
export type ProjectVersion = { id: string; projectId: string; label: string; branch: string; createdAt: string; createdBy: string; parentId?: string; status: "draft" | "review" | "approved" | "published" };
export type PublishChannel = { id: string; name: string; category: "social" | "commerce" | "cms"; connected: boolean; account?: string; capabilities: string[] };
export type AuditEvent = { id: string; action: string; actor: string; target: string; createdAt: string; severity: "info" | "warning" | "critical" };

export const PHASE32_MODULES: Phase32Module[] = [
  { id: "32.0", title: "Enterprise Foundation", description: "Shared organization, tenant, licensing and production platform state.", features: ["Organization Context", "Tenant Configuration", "License Registry", "Shared Enterprise Store", "Feature Flags", "Service Health"] },
  { id: "32.1", title: "Live Collaboration", description: "Presence, live cursors, comments, suggestions, approvals and conflict handling.", features: ["Live Presence", "Live Cursors", "Comments", "Suggestions", "Review Mode", "Approval Workflow", "Conflict Resolution"] },
  { id: "32.2", title: "Enterprise Dashboard", description: "A unified view of projects, users, storage, AI, publishing and licenses.", features: ["Organization Overview", "Project Metrics", "Storage Metrics", "AI Usage", "License Usage", "Publishing Activity", "System Alerts"] },
  { id: "32.3", title: "Version Control", description: "Snapshots, branches, compare, merge, restore and controlled promotion.", features: ["Snapshots", "Branches", "Compare Versions", "Merge", "Rollback", "Restore Points", "Release Timeline"] },
  { id: "32.4", title: "Cloud Rendering", description: "Durable render queues for video, animation, AI, export and distributed workers.", features: ["Video Render Queue", "Animation Render Queue", "AI Render Queue", "Export Workers", "Background Rendering", "Worker Capacity", "Retry Policies"] },
  { id: "32.5", title: "Marketplace 2.0", description: "Commercial distribution for templates, assets, plugins and AI workflows.", features: ["Seller Center", "Product Catalog", "Licensing", "Reviews", "Payout Ledger", "Moderation", "Marketplace Analytics"] },
  { id: "32.6", title: "Client & Project Management", description: "Clients, contracts, tasks, milestones, assignments, invoices and approvals.", features: ["Client Directory", "Projects", "Contracts", "Tasks", "Milestones", "Invoices", "Approval Requests"] },
  { id: "32.7", title: "Production Center", description: "One operational center for print, video, AI, export, publishing and automation.", features: ["Print Queue", "Video Queue", "AI Queue", "Export Queue", "Publish Queue", "Automation Queue", "Batch Operations"] },
  { id: "32.8", title: "Direct Publishing", description: "Provider-ready publishing connections for social, commerce and CMS channels.", features: ["YouTube", "TikTok", "Instagram", "Facebook", "LinkedIn", "Pinterest", "Shopify", "Etsy", "eBay", "Amazon", "WordPress"] },
  { id: "32.9", title: "Business Intelligence", description: "Revenue, downloads, usage, publishing, team, storage and performance reporting.", features: ["Revenue Analytics", "Download Analytics", "Marketplace Analytics", "Publishing Analytics", "AI Analytics", "Team Analytics", "Performance Reports"] },
  { id: "32.10", title: "Enterprise Security", description: "Identity, permissions, audit, encryption, backup, recovery and session controls.", features: ["SSO", "Azure AD", "Google Workspace", "Role Permissions", "Audit Logs", "Encryption", "Backups", "Disaster Recovery", "Session & Device Control"] },
  { id: "32.11", title: "Administration & Platform Tools", description: "Organization administration, diagnostics, accessibility, localization and developer tools.", features: ["User Manager", "Team Manager", "License Manager", "Billing Manager", "Permission Matrix", "Accessibility Center", "Localization", "Diagnostics", "Developer Mode", "Plugin Debugger"] },
  { id: "32.12", title: "Production Certification", description: "Regression, security, recovery, publishing and enterprise readiness validation.", features: ["Regression Tests", "Security Tests", "Collaboration Tests", "Publishing Tests", "Recovery Drills", "Performance Tests", "Upgrade Guide", "Certification Report"] },
];

export const DEFAULT_PUBLISH_CHANNELS: PublishChannel[] = [
  { id: "youtube", name: "YouTube", category: "social", connected: false, capabilities: ["video", "shorts", "schedule"] },
  { id: "tiktok", name: "TikTok", category: "social", connected: false, capabilities: ["video", "schedule"] },
  { id: "instagram", name: "Instagram", category: "social", connected: false, capabilities: ["post", "reel", "story"] },
  { id: "facebook", name: "Facebook", category: "social", connected: false, capabilities: ["post", "video", "schedule"] },
  { id: "linkedin", name: "LinkedIn", category: "social", connected: false, capabilities: ["post", "document", "video"] },
  { id: "pinterest", name: "Pinterest", category: "social", connected: false, capabilities: ["pin", "catalog"] },
  { id: "shopify", name: "Shopify", category: "commerce", connected: false, capabilities: ["product", "collection", "inventory"] },
  { id: "etsy", name: "Etsy", category: "commerce", connected: false, capabilities: ["listing", "inventory"] },
  { id: "ebay", name: "eBay", category: "commerce", connected: false, capabilities: ["listing", "inventory", "orders"] },
  { id: "amazon", name: "Amazon", category: "commerce", connected: false, capabilities: ["listing", "inventory"] },
  { id: "wordpress", name: "WordPress", category: "cms", connected: false, capabilities: ["page", "post", "media"] },
];

export const DEFAULT_COLLABORATORS: Collaborator[] = [
  { id: "owner", name: "Project Owner", role: "owner", presence: "online", cursor: { pageId: "page-1", x: 38, y: 42 } },
  { id: "reviewer", name: "Creative Reviewer", role: "reviewer", presence: "away" },
  { id: "editor", name: "Production Editor", role: "editor", presence: "offline" },
];

export function createEnterpriseJob(title: string, kind: EnterpriseJobKind, target?: string, owner = "Current User"): EnterpriseJob {
  return { id: `p32-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, kind, status: "queued", progress: 0, owner, createdAt: new Date().toISOString(), priority: "normal", target };
}

export function advanceEnterpriseJob(job: EnterpriseJob, amount = 20): EnterpriseJob {
  if (["completed", "failed", "cancelled"].includes(job.status)) return job;
  const progress = Math.min(100, Math.max(0, job.progress + amount));
  return { ...job, progress, status: progress >= 100 ? "completed" : "running" };
}

export function createSnapshot(projectId: string, label: string, createdBy = "Current User", branch = "main", parentId?: string): ProjectVersion {
  return { id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, projectId, label, branch, createdAt: new Date().toISOString(), createdBy, parentId, status: "draft" };
}

export function canPerform(role: Collaborator["role"], action: "edit" | "review" | "approve" | "admin"): boolean {
  const permissions: Record<Collaborator["role"], string[]> = {
    owner: ["edit", "review", "approve", "admin"], admin: ["edit", "review", "approve", "admin"], editor: ["edit", "review"], reviewer: ["review", "approve"], viewer: [],
  };
  return permissions[role].includes(action);
}

export function createAuditEvent(action: string, target: string, actor = "Current User", severity: AuditEvent["severity"] = "info"): AuditEvent {
  return { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, action, actor, target, createdAt: new Date().toISOString(), severity };
}

export function getPhase32Completion(): number { return Math.round((PHASE32_MODULES.length / 13) * 100); }
