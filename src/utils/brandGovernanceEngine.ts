export type BrandAssetType = "logo" | "color" | "font" | "icon" | "image" | "template";
export type GovernanceStatus = "approved" | "review" | "restricted" | "retired";
export type RuleSeverity = "blocker" | "warning" | "guidance";

export type BrandAsset = {
  id: string;
  name: string;
  type: BrandAssetType;
  status: GovernanceStatus;
  owner: string;
  version: string;
  usage: string;
};

export type BrandRule = {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  enabled: boolean;
};

export type ContentRequest = {
  id: string;
  title: string;
  channel: string;
  requester: string;
  dueDate: string;
  status: "intake" | "design" | "review" | "approved" | "published";
};

export const PHASE54_CAPABILITIES = [
  { id: "brand-library", title: "Governed Brand Library", description: "Centralize approved logos, colors, fonts, icons, imagery, templates, owners, and versions.", status: "Ready" as const },
  { id: "rules", title: "Brand Rule Engine", description: "Evaluate documents against required logos, color palettes, typography, safe areas, and legal text.", status: "Ready" as const },
  { id: "requests", title: "Content Operations", description: "Track creative requests from intake through design, review, approval, publication, and archive.", status: "Ready" as const },
  { id: "permissions", title: "Usage Governance", description: "Mark assets approved, restricted, under review, or retired and expose clear usage guidance.", status: "Ready" as const },
  { id: "versioning", title: "Brand Version Control", description: "Track asset versions and prevent retired assets from being treated as current.", status: "Ready" as const },
  { id: "compliance", title: "Compliance Dashboard", description: "Calculate brand health, surface blockers, and document the exact reason for each issue.", status: "Ready" as const },
  { id: "remote", title: "Remote DAM & SSO Connectors", description: "Enterprise DAM synchronization, directory groups, and remote policy enforcement require configured services.", status: "External" as const },
];

export const DEFAULT_BRAND_ASSETS: BrandAsset[] = [
  { id: "logo-primary", name: "Yaposan Primary Logo", type: "logo", status: "approved", owner: "Brand Team", version: "3.0", usage: "Primary use on light backgrounds" },
  { id: "logo-dark", name: "Yaposan Dark Logo", type: "logo", status: "approved", owner: "Brand Team", version: "2.2", usage: "Use on dark and photographic backgrounds" },
  { id: "color-core", name: "Core Brand Palette", type: "color", status: "approved", owner: "Design System", version: "4.0", usage: "Default product and marketing palette" },
  { id: "font-display", name: "Display Typography", type: "font", status: "review", owner: "Creative Director", version: "1.4", usage: "Headlines and campaign display text" },
  { id: "template-legacy", name: "Legacy Flyer Set", type: "template", status: "retired", owner: "Marketing", version: "1.0", usage: "Do not use for new work" },
];

export const DEFAULT_BRAND_RULES: BrandRule[] = [
  { id: "approved-logo", title: "Approved logo only", description: "Documents must use a currently approved logo asset.", severity: "blocker", enabled: true },
  { id: "palette", title: "Approved palette", description: "Primary colors should come from the active brand palette.", severity: "warning", enabled: true },
  { id: "safe-area", title: "Logo clear space", description: "Maintain the configured clear space around every brand mark.", severity: "warning", enabled: true },
  { id: "font", title: "Brand typography", description: "Use approved heading and body font families.", severity: "guidance", enabled: true },
  { id: "legal", title: "Required legal copy", description: "Published campaign assets must include required legal or accessibility copy.", severity: "blocker", enabled: true },
];

export const DEFAULT_CONTENT_REQUESTS: ContentRequest[] = [
  { id: "request-1", title: "Fall donation campaign", channel: "Print + Social", requester: "Marketing", dueDate: "Aug 12", status: "design" },
  { id: "request-2", title: "Store opening toolkit", channel: "Multi-channel", requester: "Retail Operations", dueDate: "Aug 18", status: "review" },
  { id: "request-3", title: "Annual impact report", channel: "PDF + Web", requester: "Development", dueDate: "Sep 05", status: "intake" },
];

export function updateAssetStatus(assets: BrandAsset[], assetId: string, status: GovernanceStatus): BrandAsset[] {
  return assets.map((asset) => asset.id === assetId ? { ...asset, status } : asset);
}

export function updateRequestStatus(requests: ContentRequest[], requestId: string, status: ContentRequest["status"]): ContentRequest[] {
  return requests.map((request) => request.id === requestId ? { ...request, status } : request);
}

export function brandGovernanceScore(assets: BrandAsset[], rules: BrandRule[]): number {
  const currentAssets = assets.filter((asset) => asset.status === "approved").length;
  const assetScore = assets.length ? (currentAssets / assets.length) * 100 : 100;
  const enabledRules = rules.filter((rule) => rule.enabled).length;
  const ruleScore = rules.length ? (enabledRules / rules.length) * 100 : 100;
  return Math.round((assetScore * 0.65) + (ruleScore * 0.35));
}

export function brandGovernanceBlockers(assets: BrandAsset[], rules: BrandRule[], requests: ContentRequest[]): string[] {
  const blockers: string[] = [];
  if (!assets.some((asset) => asset.type === "logo" && asset.status === "approved")) blockers.push("Approve at least one primary logo.");
  if (!assets.some((asset) => asset.type === "color" && asset.status === "approved")) blockers.push("Approve at least one brand color palette.");
  const disabledBlockers = rules.filter((rule) => rule.severity === "blocker" && !rule.enabled);
  if (disabledBlockers.length) blockers.push(`${disabledBlockers.length} blocker rule${disabledBlockers.length === 1 ? " is" : "s are"} disabled.`);
  const overdueIntake = requests.filter((request) => request.status === "intake").length;
  if (overdueIntake) blockers.push(`${overdueIntake} content request${overdueIntake === 1 ? " is" : "s are"} still in intake.`);
  return blockers;
}

export const PHASE54_BRAND_GOVERNANCE = {
  phase: 54,
  label: "Enterprise Brand Governance & Content Operations",
  summary: "Governed brand assets, enforceable rules, creative-request operations, usage controls, and evidence-based compliance monitoring.",
  ready: PHASE54_CAPABILITIES.filter((item) => item.status === "Ready").length,
  total: PHASE54_CAPABILITIES.length,
} as const;
