export type Phase38Module = {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
  externalRequirements: string[];
};

export type ReleaseStatus = "not-started" | "in-progress" | "blocked" | "validated" | "released";

export type CommercialCheck = {
  id: string;
  moduleId: string;
  title: string;
  status: ReleaseStatus;
  owner: string;
  evidence?: string;
  updatedAt?: string;
};

export type CommercialConnector = {
  id: string;
  name: string;
  category: "marketplace" | "billing" | "publishing" | "desktop" | "mobile" | "analytics" | "support";
  environment: "sandbox" | "production";
  configured: boolean;
  lastValidatedAt?: string;
};

export type ReleaseArtifact = {
  id: string;
  name: string;
  platform: "web" | "windows" | "macos" | "ios" | "android" | "documentation";
  version: string;
  status: "draft" | "building" | "signed" | "approved" | "published";
};

export const PHASE38_MODULES: Phase38Module[] = [
  { id: "38.0", title: "Marketplace Platform", description: "Creator onboarding, templates, assets, plugins, reviews, licensing, moderation and payout-ready marketplace operations.", capabilities: ["Creator profiles", "Template and asset listings", "Plugin listings", "Reviews and ratings", "Moderation queues", "License records"], externalRequirements: ["Creator identity verification", "Marketplace storage and search", "Payout provider account"] },
  { id: "38.1", title: "Commerce & Billing", description: "Subscription plans, metering, invoices, trials, coupons, team billing, taxes and entitlement enforcement.", capabilities: ["Subscription catalog", "Usage metering", "Invoices", "Trials and coupons", "Team billing", "Entitlements"], externalRequirements: ["Payment processor production keys", "Tax configuration", "Billing webhook endpoint"] },
  { id: "38.2", title: "Publishing Connectors", description: "Governed publishing workflows for commerce, websites, social channels and cloud destinations.", capabilities: ["Shopify", "WordPress", "Amazon", "Etsy", "eBay", "Social publishing", "Cloud-drive delivery"], externalRequirements: ["OAuth applications", "Marketplace approvals", "Production publishing credentials"] },
  { id: "38.3", title: "Desktop Platform", description: "Windows and macOS installers, signing, updates, file associations, native printing and release-channel governance.", capabilities: ["Windows packaging", "macOS packaging", "Code signing", "Auto-update feeds", "File associations", "Native print bridge"], externalRequirements: ["Windows signing certificate", "Apple developer signing identity", "Update hosting"] },
  { id: "38.4", title: "Mobile Platform", description: "iOS, Android and tablet release workflows with offline state, push notifications and store readiness.", capabilities: ["iOS release", "Android release", "Tablet layouts", "Offline projects", "Push notifications", "Store metadata"], externalRequirements: ["Apple Developer account", "Google Play account", "Push notification credentials"] },
  { id: "38.5", title: "Production Rendering", description: "Scalable rendering governance for documents, images, video, print and high-volume export workloads.", capabilities: ["Render profiles", "GPU worker contracts", "Print rendering", "Video rendering", "Font packaging", "Export optimization"], externalRequirements: ["GPU worker pool", "Licensed production fonts", "Render-farm storage"] },
  { id: "38.6", title: "Analytics Platform", description: "Privacy-aware product, revenue, publishing, AI-usage and operational analytics with governed retention.", capabilities: ["Product analytics", "Revenue analytics", "AI usage", "Publishing performance", "Cost reporting", "Retention policy"], externalRequirements: ["Analytics destination", "Consent configuration", "Production event pipeline"] },
  { id: "38.7", title: "Customer Success", description: "Support cases, diagnostics, feedback, service status, escalation and customer-health workflows.", capabilities: ["Help center", "Support cases", "Diagnostic bundles", "Feedback intake", "Service status", "Escalation policy"], externalRequirements: ["Support mailbox or platform", "Status-page provider", "Support staffing plan"] },
  { id: "38.8", title: "Documentation Platform", description: "Versioned user, administrator, developer, SDK and API documentation with tutorials and samples.", capabilities: ["User guide", "Administrator guide", "Developer guide", "SDK reference", "API reference", "Tutorial catalog"], externalRequirements: ["Documentation hosting", "Editorial approval", "Versioned publishing workflow"] },
  { id: "38.9", title: "Accessibility & Localization", description: "WCAG-focused accessibility controls, localization workflows, regional formatting and translation governance.", capabilities: ["Keyboard navigation", "Screen-reader labels", "Contrast auditing", "Localization catalog", "Regional formats", "Translation review"], externalRequirements: ["Accessibility audit", "Professional translation review", "Locale QA devices"] },
  { id: "38.10", title: "Quality Platform", description: "Automated regression, performance, security, compatibility, accessibility and release-gate testing.", capabilities: ["Unit tests", "Integration tests", "End-to-end tests", "Performance tests", "Security tests", "Compatibility matrix"], externalRequirements: ["CI runners", "Device and browser lab", "Independent security testing"] },
  { id: "38.11", title: "Commercial Release Certification", description: "Evidence-based certification of legal, financial, operational, store and customer-support readiness.", capabilities: ["Release evidence", "Legal approval", "Finance approval", "Store approval", "Support readiness", "Go-live review"], externalRequirements: ["Legal sign-off", "Finance sign-off", "Release council approval"] },
  { id: "38.12", title: "Production Release", description: "Final release control requiring all critical checks, connectors, and artifacts to be production-ready.", capabilities: ["Release manifest", "Version freeze", "Signed artifacts", "Production launch", "Rollback plan", "Post-launch review"], externalRequirements: ["All critical checks released", "All required connectors configured", "All required artifacts approved"] },
];

export const DEFAULT_COMMERCIAL_CHECKS: CommercialCheck[] = PHASE38_MODULES.flatMap((module) =>
  module.externalRequirements.map((title, index) => ({
    id: `commercial-${module.id}-${index + 1}`,
    moduleId: module.id,
    title,
    status: "not-started" as ReleaseStatus,
    owner: module.id === "38.12" ? "Release Council" : "Commercial Operations",
  })),
);

export const DEFAULT_COMMERCIAL_CONNECTORS: CommercialConnector[] = [
  { id: "stripe", name: "Payment processor", category: "billing", environment: "production", configured: false },
  { id: "shopify", name: "Shopify", category: "publishing", environment: "production", configured: false },
  { id: "wordpress", name: "WordPress", category: "publishing", environment: "production", configured: false },
  { id: "ebay", name: "eBay", category: "publishing", environment: "production", configured: false },
  { id: "apple", name: "Apple App Store", category: "mobile", environment: "production", configured: false },
  { id: "google-play", name: "Google Play", category: "mobile", environment: "production", configured: false },
  { id: "desktop-signing", name: "Desktop code signing", category: "desktop", environment: "production", configured: false },
  { id: "analytics", name: "Analytics destination", category: "analytics", environment: "production", configured: false },
  { id: "support", name: "Customer support platform", category: "support", environment: "production", configured: false },
];

export const DEFAULT_RELEASE_ARTIFACTS: ReleaseArtifact[] = [
  { id: "web", name: "Yaposan Web", platform: "web", version: "38.0.0", status: "draft" },
  { id: "windows", name: "Yaposan for Windows", platform: "windows", version: "38.0.0", status: "draft" },
  { id: "macos", name: "Yaposan for macOS", platform: "macos", version: "38.0.0", status: "draft" },
  { id: "ios", name: "Yaposan for iOS", platform: "ios", version: "38.0.0", status: "draft" },
  { id: "android", name: "Yaposan for Android", platform: "android", version: "38.0.0", status: "draft" },
  { id: "docs", name: "Yaposan Documentation", platform: "documentation", version: "38.0.0", status: "draft" },
];

const STATUS_SCORE: Record<ReleaseStatus, number> = { "not-started": 0, blocked: 0, "in-progress": 50, validated: 85, released: 100 };

export function updateCommercialCheck(check: CommercialCheck, status: ReleaseStatus, evidence?: string): CommercialCheck {
  return { ...check, status, evidence: evidence ?? check.evidence, updatedAt: new Date().toISOString() };
}

export function commercialReadinessScore(checks: CommercialCheck[]): number {
  if (!checks.length) return 0;
  return Math.round(checks.reduce((total, check) => total + STATUS_SCORE[check.status], 0) / checks.length);
}

export function commercialModuleScore(moduleId: string, checks: CommercialCheck[]): number {
  return commercialReadinessScore(checks.filter((check) => check.moduleId === moduleId));
}

export function commercialReleaseBlockers(checks: CommercialCheck[], connectors: CommercialConnector[], artifacts: ReleaseArtifact[]): string[] {
  const checkBlockers = checks.filter((check) => check.status !== "released").map((check) => `${check.moduleId}: ${check.title}`);
  const connectorBlockers = connectors.filter((connector) => !connector.configured).map((connector) => `Connector: ${connector.name}`);
  const artifactBlockers = artifacts.filter((artifact) => artifact.status !== "approved" && artifact.status !== "published").map((artifact) => `Artifact: ${artifact.name}`);
  return [...checkBlockers, ...connectorBlockers, ...artifactBlockers];
}

export function certifyPhase38(checks: CommercialCheck[], connectors: CommercialConnector[], artifacts: ReleaseArtifact[]): { certified: boolean; score: number; blockers: string[] } {
  const score = commercialReadinessScore(checks);
  const blockers = commercialReleaseBlockers(checks, connectors, artifacts);
  return { certified: score === 100 && blockers.length === 0, score, blockers };
}
