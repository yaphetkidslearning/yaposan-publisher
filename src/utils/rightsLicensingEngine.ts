export type RightsStatus = "cleared" | "review" | "restricted" | "expired";
export type LicenseScope = "internal" | "commercial" | "editorial" | "broadcast" | "global";
export type RiskLevel = "low" | "medium" | "high";

export type LicensedAsset = {
  id: string;
  name: string;
  source: string;
  owner: string;
  scope: LicenseScope;
  status: RightsStatus;
  expiresOn?: string;
  territories: string[];
  channels: string[];
  attribution?: string;
};

export type UsageRequest = {
  id: string;
  title: string;
  assetId: string;
  channel: string;
  territory: string;
  plannedDate: string;
  status: "draft" | "review" | "approved" | "rejected";
};

export type RightsRule = {
  id: string;
  title: string;
  description: string;
  risk: RiskLevel;
  enabled: boolean;
};

export const PHASE55_CAPABILITIES = [
  { id: "registry", title: "Rights Registry", description: "Track source, owner, license scope, territories, channels, attribution, and expiration for every governed asset.", status: "Ready" as const },
  { id: "clearance", title: "Usage Clearance", description: "Check whether an asset is permitted for a planned channel, date, and territory before publication.", status: "Ready" as const },
  { id: "expiry", title: "Expiration Monitoring", description: "Surface expired and soon-to-expire rights before they become publishing incidents.", status: "Ready" as const },
  { id: "attribution", title: "Attribution Controls", description: "Store required credit lines and identify assets that cannot be published without attribution.", status: "Ready" as const },
  { id: "requests", title: "Rights Approval Queue", description: "Route uncertain usage through draft, review, approval, or rejection states.", status: "Ready" as const },
  { id: "audit", title: "Rights Risk Audit", description: "Calculate a compliance score and report exact blockers rather than assuming assets are cleared.", status: "Ready" as const },
  { id: "external", title: "External Rights Providers", description: "Stock-provider APIs, contract repositories, automated takedowns, and legal review require connected services.", status: "External" as const },
];

export const DEFAULT_LICENSED_ASSETS: LicensedAsset[] = [
  { id: "asset-logo", name: "Yaposan Primary Logo", source: "Internal Brand Team", owner: "Yaposan", scope: "global", status: "cleared", territories: ["Worldwide"], channels: ["Print", "Web", "Social", "Video"] },
  { id: "asset-photo", name: "City Skyline Photo", source: "Licensed Stock", owner: "Stock Contributor", scope: "commercial", status: "review", expiresOn: "2026-12-31", territories: ["US", "Canada"], channels: ["Web", "Social"], attribution: "Photo credit required in editorial use" },
  { id: "asset-font", name: "Premium Display Font", source: "Font Foundry", owner: "Foundry", scope: "commercial", status: "cleared", expiresOn: "2027-06-30", territories: ["Worldwide"], channels: ["Print", "Web"] },
  { id: "asset-video", name: "Launch Background Footage", source: "Creator Upload", owner: "Independent Creator", scope: "broadcast", status: "restricted", expiresOn: "2026-09-15", territories: ["US"], channels: ["Video"] },
  { id: "asset-legacy", name: "Legacy Product Photo", source: "Archive", owner: "Unknown", scope: "internal", status: "expired", expiresOn: "2025-12-31", territories: ["Internal"], channels: ["Internal"] },
];

export const DEFAULT_USAGE_REQUESTS: UsageRequest[] = [
  { id: "usage-1", title: "Fall campaign landing page", assetId: "asset-photo", channel: "Web", territory: "US", plannedDate: "2026-08-15", status: "review" },
  { id: "usage-2", title: "Launch announcement video", assetId: "asset-video", channel: "Video", territory: "US", plannedDate: "2026-08-22", status: "draft" },
  { id: "usage-3", title: "Annual report cover", assetId: "asset-logo", channel: "Print", territory: "Worldwide", plannedDate: "2026-09-01", status: "approved" },
];

export const DEFAULT_RIGHTS_RULES: RightsRule[] = [
  { id: "no-expired", title: "Block expired assets", description: "Expired assets cannot be published or exported for external distribution.", risk: "high", enabled: true },
  { id: "territory", title: "Territory must match", description: "Planned distribution must be covered by the asset license territory.", risk: "high", enabled: true },
  { id: "channel", title: "Channel must match", description: "The publication channel must be explicitly licensed.", risk: "high", enabled: true },
  { id: "attribution", title: "Required attribution", description: "Assets with credit requirements must include the approved attribution line.", risk: "medium", enabled: true },
  { id: "owner", title: "Known rights owner", description: "Every externally published asset should identify a rights owner or licensor.", risk: "medium", enabled: true },
];

export function updateRightsStatus(assets: LicensedAsset[], assetId: string, status: RightsStatus): LicensedAsset[] {
  return assets.map((asset) => asset.id === assetId ? { ...asset, status } : asset);
}

export function updateUsageRequest(requests: UsageRequest[], requestId: string, status: UsageRequest["status"]): UsageRequest[] {
  return requests.map((request) => request.id === requestId ? { ...request, status } : request);
}

export function canUseAsset(asset: LicensedAsset, channel: string, territory: string): boolean {
  if (asset.status !== "cleared") return false;
  const channelAllowed = asset.channels.includes(channel) || asset.channels.includes("All");
  const territoryAllowed = asset.territories.includes(territory) || asset.territories.includes("Worldwide");
  return channelAllowed && territoryAllowed;
}

export function rightsComplianceScore(assets: LicensedAsset[], rules: RightsRule[]): number {
  const cleared = assets.filter((asset) => asset.status === "cleared").length;
  const assetScore = assets.length ? (cleared / assets.length) * 100 : 100;
  const activeRules = rules.filter((rule) => rule.enabled).length;
  const ruleScore = rules.length ? (activeRules / rules.length) * 100 : 100;
  return Math.round((assetScore * 0.7) + (ruleScore * 0.3));
}

export function rightsBlockers(assets: LicensedAsset[], requests: UsageRequest[], rules: RightsRule[]): string[] {
  const blockers: string[] = [];
  const expired = assets.filter((asset) => asset.status === "expired").length;
  if (expired) blockers.push(`${expired} asset${expired === 1 ? " is" : "s are"} expired.`);
  const restricted = assets.filter((asset) => asset.status === "restricted").length;
  if (restricted) blockers.push(`${restricted} asset${restricted === 1 ? " has" : "s have"} restricted usage.`);
  const unresolved = requests.filter((request) => request.status === "draft" || request.status === "review").length;
  if (unresolved) blockers.push(`${unresolved} usage request${unresolved === 1 ? " requires" : "s require"} clearance.`);
  const disabledHighRisk = rules.filter((rule) => rule.risk === "high" && !rule.enabled).length;
  if (disabledHighRisk) blockers.push(`${disabledHighRisk} high-risk rights rule${disabledHighRisk === 1 ? " is" : "s are"} disabled.`);
  return blockers;
}

export const PHASE55_RIGHTS_LICENSING = {
  phase: 55,
  label: "Content Rights, Licensing & Usage Compliance",
  summary: "Track licenses, verify permitted usage, monitor expiration, enforce attribution, and stop unapproved assets before publishing.",
  ready: PHASE55_CAPABILITIES.filter((item) => item.status === "Ready").length,
  total: PHASE55_CAPABILITIES.length,
} as const;
