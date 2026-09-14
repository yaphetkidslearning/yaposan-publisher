export type ProvenanceStatus = "verified" | "review" | "broken" | "unsigned";
export type OriginType = "camera" | "designer" | "ai" | "stock" | "import" | "system";
export type DisclosureLevel = "none" | "assisted" | "generated" | "composited";

export type ProvenanceEvent = {
  id: string;
  action: "created" | "imported" | "edited" | "approved" | "exported" | "signed";
  actor: string;
  timestamp: string;
  application: string;
  note?: string;
};

export type ProvenanceRecord = {
  id: string;
  assetName: string;
  origin: OriginType;
  creator: string;
  source?: string;
  disclosure: DisclosureLevel;
  status: ProvenanceStatus;
  fingerprint: string;
  signedBy?: string;
  events: ProvenanceEvent[];
};

export type TrustPolicy = {
  id: string;
  title: string;
  description: string;
  severity: "blocker" | "warning" | "guidance";
  enabled: boolean;
};

export type ExportManifest = {
  documentId: string;
  title: string;
  generatedAt: string;
  assetFingerprints: string[];
  disclosureSummary: Record<DisclosureLevel, number>;
  signer?: string;
};

export const PHASE56_CAPABILITIES = [
  { id: "origin", title: "Origin Registry", description: "Record where each asset came from, who created it, and whether it was imported, generated, captured, or licensed.", status: "Ready" as const },
  { id: "history", title: "Edit History Chain", description: "Maintain append-only creation, edit, approval, export, and signing events for governed content.", status: "Ready" as const },
  { id: "fingerprint", title: "Content Fingerprints", description: "Generate deterministic local fingerprints and flag records whose integrity information no longer matches.", status: "Ready" as const },
  { id: "disclosure", title: "AI & Composite Disclosure", description: "Track whether content is original, AI-assisted, AI-generated, or composited before distribution.", status: "Ready" as const },
  { id: "manifest", title: "Export Trust Manifest", description: "Create a portable manifest containing fingerprints, disclosure totals, signer identity, and generation time.", status: "Ready" as const },
  { id: "audit", title: "Authenticity Audit", description: "Calculate a trust score and report exact blockers instead of assuming content is authentic.", status: "Ready" as const },
  { id: "external", title: "Standards-Based Credentials", description: "C2PA signing, certificate authorities, timestamp services, and public verification require connected external infrastructure.", status: "External" as const },
];

export const DEFAULT_PROVENANCE_RECORDS: ProvenanceRecord[] = [
  {
    id: "prov-logo", assetName: "Yaposan Primary Logo", origin: "designer", creator: "Yaposan Brand Team", disclosure: "none", status: "verified", fingerprint: "yp-6f7a-2d10",
    signedBy: "Brand Governance", events: [
      { id: "e1", action: "created", actor: "Brand Team", timestamp: "2026-07-10T14:30:00Z", application: "Yaposan" },
      { id: "e2", action: "approved", actor: "Brand Governance", timestamp: "2026-07-11T16:00:00Z", application: "Yaposan" },
      { id: "e3", action: "signed", actor: "Brand Governance", timestamp: "2026-07-11T16:05:00Z", application: "Yaposan" },
    ],
  },
  {
    id: "prov-campaign", assetName: "Fall Campaign Hero", origin: "ai", creator: "Creative Studio", source: "Yaposan AI Workspace", disclosure: "generated", status: "review", fingerprint: "yp-29d4-a117",
    events: [
      { id: "e4", action: "created", actor: "Creative Studio", timestamp: "2026-07-28T13:00:00Z", application: "Yaposan AI" },
      { id: "e5", action: "edited", actor: "Design Team", timestamp: "2026-07-29T15:20:00Z", application: "Yaposan Publisher", note: "Typography and crop updated" },
    ],
  },
  {
    id: "prov-photo", assetName: "Baltimore Skyline Photo", origin: "stock", creator: "Stock Contributor", source: "Licensed Stock Provider", disclosure: "none", status: "verified", fingerprint: "yp-c45b-98e2",
    signedBy: "Rights & Licensing", events: [
      { id: "e6", action: "imported", actor: "Asset Manager", timestamp: "2026-07-22T10:10:00Z", application: "Yaposan Asset Marketplace" },
      { id: "e7", action: "approved", actor: "Rights & Licensing", timestamp: "2026-07-22T11:00:00Z", application: "Yaposan" },
    ],
  },
  {
    id: "prov-legacy", assetName: "Legacy Background Texture", origin: "import", creator: "Unknown", disclosure: "composited", status: "broken", fingerprint: "missing",
    events: [{ id: "e8", action: "imported", actor: "Migration Tool", timestamp: "2026-06-02T09:00:00Z", application: "Yaposan Migration" }],
  },
];

export const DEFAULT_TRUST_POLICIES: TrustPolicy[] = [
  { id: "fingerprint", title: "Require integrity fingerprint", description: "Every externally distributed asset must include a non-placeholder fingerprint.", severity: "blocker", enabled: true },
  { id: "creator", title: "Require identified creator", description: "Unknown creators must be reviewed before public release.", severity: "blocker", enabled: true },
  { id: "ai-disclosure", title: "Disclose generated media", description: "AI-generated and composited media must carry an accurate disclosure classification.", severity: "blocker", enabled: true },
  { id: "signing", title: "Prefer signed approval", description: "High-value release assets should include an identified approving signer.", severity: "warning", enabled: true },
  { id: "history", title: "Require provenance event", description: "Every governed asset should contain at least one creation or import event.", severity: "warning", enabled: true },
];

export function updateProvenanceStatus(records: ProvenanceRecord[], recordId: string, status: ProvenanceStatus): ProvenanceRecord[] {
  return records.map((record) => record.id === recordId ? { ...record, status } : record);
}

export function appendProvenanceEvent(records: ProvenanceRecord[], recordId: string, event: ProvenanceEvent): ProvenanceRecord[] {
  return records.map((record) => record.id === recordId ? { ...record, events: [...record.events, event] } : record);
}

export function createLocalFingerprint(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `yp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function provenanceTrustScore(records: ProvenanceRecord[], policies: TrustPolicy[]): number {
  const recordScore = records.length
    ? records.reduce((sum, record) => {
        const statusScore = record.status === "verified" ? 100 : record.status === "review" ? 65 : record.status === "unsigned" ? 45 : 0;
        const fingerprintScore = record.fingerprint && record.fingerprint !== "missing" ? 100 : 0;
        const creatorScore = record.creator && record.creator !== "Unknown" ? 100 : 0;
        const eventScore = record.events.length > 0 ? 100 : 0;
        return sum + (statusScore * 0.45) + (fingerprintScore * 0.25) + (creatorScore * 0.2) + (eventScore * 0.1);
      }, 0) / records.length
    : 100;
  const policyScore = policies.length ? (policies.filter((policy) => policy.enabled).length / policies.length) * 100 : 100;
  return Math.round((recordScore * 0.85) + (policyScore * 0.15));
}

export function provenanceBlockers(records: ProvenanceRecord[], policies: TrustPolicy[]): string[] {
  const blockers: string[] = [];
  const broken = records.filter((record) => record.status === "broken").length;
  if (broken) blockers.push(`${broken} provenance record${broken === 1 ? " has" : "s have"} broken integrity.`);
  const missingFingerprint = records.filter((record) => !record.fingerprint || record.fingerprint === "missing").length;
  if (missingFingerprint) blockers.push(`${missingFingerprint} asset${missingFingerprint === 1 ? " is" : "s are"} missing a valid fingerprint.`);
  const unknownCreator = records.filter((record) => !record.creator || record.creator === "Unknown").length;
  if (unknownCreator) blockers.push(`${unknownCreator} asset${unknownCreator === 1 ? " has" : "s have"} an unknown creator.`);
  const disabledBlockers = policies.filter((policy) => policy.severity === "blocker" && !policy.enabled).length;
  if (disabledBlockers) blockers.push(`${disabledBlockers} blocker-level trust polic${disabledBlockers === 1 ? "y is" : "ies are"} disabled.`);
  return blockers;
}

export function buildExportManifest(documentId: string, title: string, records: ProvenanceRecord[], signer?: string): ExportManifest {
  const disclosureSummary: Record<DisclosureLevel, number> = { none: 0, assisted: 0, generated: 0, composited: 0 };
  records.forEach((record) => { disclosureSummary[record.disclosure] += 1; });
  return {
    documentId,
    title,
    generatedAt: new Date().toISOString(),
    assetFingerprints: records.map((record) => record.fingerprint).filter((fingerprint) => Boolean(fingerprint) && fingerprint !== "missing"),
    disclosureSummary,
    signer,
  };
}

export const PHASE56_CONTENT_PROVENANCE = {
  phase: 56,
  label: "Content Provenance, Authenticity & Trust",
  summary: "Track content origin, edit history, fingerprints, AI disclosures, signatures, and export manifests before publication.",
  ready: PHASE56_CAPABILITIES.filter((item) => item.status === "Ready").length,
  total: PHASE56_CAPABILITIES.length,
} as const;
