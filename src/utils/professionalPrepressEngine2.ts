export type PrepressSeverity2 = "error" | "warning" | "info";
export type PrepressColorant2 = "C" | "M" | "Y" | "K" | string;
export type PrepressObject2 = {
  id: string;
  pageId: string;
  kind: "text" | "vector" | "image" | "line" | "barcode" | "other";
  bounds: { x: number; y: number; width: number; height: number };
  fill?: { colorants: Partial<Record<PrepressColorant2, number>>; overprint?: boolean; knockout?: boolean };
  stroke?: { colorants: Partial<Record<PrepressColorant2, number>>; width: number; overprint?: boolean };
  image?: { dpi: number; effectiveDpi?: number; colorSpace?: "rgb" | "cmyk" | "gray" | "lab"; embeddedProfile?: boolean };
  text?: { fontFamily: string; fontSize: number; embedded: boolean; outlined?: boolean; restricted?: boolean };
  transparency?: { opacity: number; blendMode?: string; flattened?: boolean };
};
export type PrepressPage2 = {
  id: string;
  number: number;
  width: number;
  height: number;
  bleed: { top: number; right: number; bottom: number; left: number };
  safeMargin: number;
  objects: PrepressObject2[];
};
export type PrepressDocument2 = {
  id: string;
  title: string;
  pages: PrepressPage2[];
  outputIntent?: string;
  colorants?: Array<{ name: string; type: "process" | "spot"; alternate?: string }>;
  metadata?: Record<string, string>;
};
export type PressProfile2 = {
  id: string;
  name: string;
  process: "offset" | "digital" | "flexo" | "screen" | "large-format";
  maxTotalInk: number;
  minImageDpi: number;
  minLineWidth: number;
  minReverseLineWidth: number;
  defaultTrapWidth: number;
  requireOutputIntent: boolean;
  allowTransparency: boolean;
  allowedSpotColors?: string[];
};
export type PrepressIssue2 = {
  severity: PrepressSeverity2;
  code: string;
  message: string;
  pageId?: string;
  objectId?: string;
  value?: number | string;
  limit?: number | string;
};
export type TrapPlan2 = {
  objectId: string;
  pageId: string;
  mode: "spread" | "choke" | "centerline" | "none";
  width: number;
  reason: string;
};
export type SeparationPlate2 = {
  name: string;
  type: "process" | "spot";
  objectIds: string[];
  coveragePercent: number;
  overprintObjectIds: string[];
};
export type PrepressCertificate2 = {
  version: "65.0";
  documentId: string;
  profileId: string;
  certifiedAt: string;
  passed: boolean;
  errorCount: number;
  warningCount: number;
  checksum: string;
  summary: string[];
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};
const inkTotal = (colorants: Partial<Record<PrepressColorant2, number>> = {}) =>
  Object.entries(colorants).reduce((sum, [, value]) => sum + clamp(Number(value ?? 0), 0, 100), 0);
const rectInside = (inner: PrepressObject2["bounds"], outer: PrepressObject2["bounds"]) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

export const DEFAULT_PRESS_PROFILES2: PressProfile2[] = [
  { id: "offset-coated", name: "Offset Coated", process: "offset", maxTotalInk: 300, minImageDpi: 300, minLineWidth: 0.25, minReverseLineWidth: 0.4, defaultTrapWidth: 0.2, requireOutputIntent: true, allowTransparency: true },
  { id: "digital-production", name: "Digital Production", process: "digital", maxTotalInk: 280, minImageDpi: 200, minLineWidth: 0.2, minReverseLineWidth: 0.35, defaultTrapWidth: 0.15, requireOutputIntent: true, allowTransparency: true },
  { id: "flexo-packaging", name: "Flexographic Packaging", process: "flexo", maxTotalInk: 260, minImageDpi: 250, minLineWidth: 0.35, minReverseLineWidth: 0.6, defaultTrapWidth: 0.3, requireOutputIntent: true, allowTransparency: false },
];

export function normalizePressProfile2(input: Partial<PressProfile2> & Pick<PressProfile2, "id" | "name" | "process">): PressProfile2 {
  return {
    id: input.id.trim() || "custom-press",
    name: input.name.trim() || "Custom Press",
    process: input.process,
    maxTotalInk: clamp(input.maxTotalInk ?? 300, 100, 400),
    minImageDpi: Math.round(clamp(input.minImageDpi ?? 300, 72, 1200)),
    minLineWidth: clamp(input.minLineWidth ?? 0.25, 0.05, 5),
    minReverseLineWidth: clamp(input.minReverseLineWidth ?? 0.4, 0.05, 5),
    defaultTrapWidth: clamp(input.defaultTrapWidth ?? 0.2, 0, 5),
    requireOutputIntent: input.requireOutputIntent ?? true,
    allowTransparency: input.allowTransparency ?? true,
    allowedSpotColors: input.allowedSpotColors ? [...new Set(input.allowedSpotColors)] : undefined,
  };
}

export function inspectPrepressDocument2(document: PrepressDocument2, profileInput: PressProfile2): PrepressIssue2[] {
  const profile = normalizePressProfile2(profileInput);
  const issues: PrepressIssue2[] = [];
  if (!document.pages.length) issues.push({ severity: "error", code: "NO_PAGES", message: "Document has no printable pages." });
  if (profile.requireOutputIntent && !document.outputIntent) issues.push({ severity: "error", code: "MISSING_OUTPUT_INTENT", message: "Press profile requires an output intent." });
  const spotNames = new Set((document.colorants ?? []).filter(c => c.type === "spot").map(c => c.name));
  if (profile.allowedSpotColors) {
    for (const spot of spotNames) if (!profile.allowedSpotColors.includes(spot)) issues.push({ severity: "warning", code: "UNAPPROVED_SPOT", message: `Spot color is not approved for this press: ${spot}`, value: spot });
  }
  for (const page of document.pages) {
    const trim = { x: 0, y: 0, width: page.width, height: page.height };
    const safe = { x: page.safeMargin, y: page.safeMargin, width: page.width - page.safeMargin * 2, height: page.height - page.safeMargin * 2 };
    if (Math.min(page.bleed.top, page.bleed.right, page.bleed.bottom, page.bleed.left) <= 0) issues.push({ severity: "warning", code: "MISSING_BLEED", message: `Page ${page.number} has incomplete bleed.`, pageId: page.id });
    for (const object of page.objects) {
      if (object.bounds.width <= 0 || object.bounds.height <= 0) issues.push({ severity: "error", code: "INVALID_BOUNDS", message: "Object has invalid bounds.", pageId: page.id, objectId: object.id });
      if (!rectInside(object.bounds, trim) && Math.min(page.bleed.top, page.bleed.right, page.bleed.bottom, page.bleed.left) <= 0) issues.push({ severity: "warning", code: "OBJECT_OUTSIDE_TRIM_NO_BLEED", message: "Object extends outside trim but page has no complete bleed.", pageId: page.id, objectId: object.id });
      if ((object.kind === "text" || object.kind === "barcode") && !rectInside(object.bounds, safe)) issues.push({ severity: "warning", code: "OUTSIDE_SAFE_ZONE", message: "Critical object is outside the safe zone.", pageId: page.id, objectId: object.id });
      for (const paint of [object.fill, object.stroke]) {
        if (!paint) continue;
        const total = inkTotal(paint.colorants);
        if (total > profile.maxTotalInk) issues.push({ severity: "error", code: "TOTAL_INK_LIMIT", message: "Total ink coverage exceeds the press limit.", pageId: page.id, objectId: object.id, value: total, limit: profile.maxTotalInk });
        for (const name of Object.keys(paint.colorants)) if (!["C", "M", "Y", "K"].includes(name) && !spotNames.has(name)) issues.push({ severity: "warning", code: "UNREGISTERED_SPOT", message: `Object uses an unregistered spot color: ${name}`, pageId: page.id, objectId: object.id, value: name });
      }
      if (object.image) {
        const dpi = object.image.effectiveDpi ?? object.image.dpi;
        if (dpi < profile.minImageDpi) issues.push({ severity: "warning", code: "LOW_IMAGE_DPI", message: "Image resolution is below the press target.", pageId: page.id, objectId: object.id, value: dpi, limit: profile.minImageDpi });
        if (object.image.colorSpace === "rgb" && profile.process !== "digital") issues.push({ severity: "warning", code: "RGB_IMAGE", message: "RGB image should be converted for this press process.", pageId: page.id, objectId: object.id });
        if (!object.image.embeddedProfile) issues.push({ severity: "info", code: "UNTAGGED_IMAGE", message: "Image has no embedded color profile.", pageId: page.id, objectId: object.id });
      }
      if (object.stroke && object.stroke.width < profile.minLineWidth) issues.push({ severity: "warning", code: "HAIRLINE", message: "Stroke is thinner than the press minimum.", pageId: page.id, objectId: object.id, value: object.stroke.width, limit: profile.minLineWidth });
      if (object.text) {
        if (!object.text.embedded && !object.text.outlined) issues.push({ severity: "error", code: "FONT_NOT_EMBEDDED", message: `Font is neither embedded nor outlined: ${object.text.fontFamily}`, pageId: page.id, objectId: object.id });
        if (object.text.restricted && !object.text.outlined) issues.push({ severity: "error", code: "RESTRICTED_FONT", message: `Restricted font must be outlined: ${object.text.fontFamily}`, pageId: page.id, objectId: object.id });
      }
      if (object.transparency && object.transparency.opacity < 1 && !profile.allowTransparency && !object.transparency.flattened) issues.push({ severity: "error", code: "UNFLATTENED_TRANSPARENCY", message: "Transparency must be flattened for this press profile.", pageId: page.id, objectId: object.id });
      if (object.fill?.overprint && object.fill?.knockout) issues.push({ severity: "error", code: "OVERPRINT_KNOCKOUT_CONFLICT", message: "Fill cannot be both overprinting and knockout.", pageId: page.id, objectId: object.id });
    }
  }
  return issues;
}

export function buildTrapPlan2(document: PrepressDocument2, profileInput: PressProfile2): TrapPlan2[] {
  const profile = normalizePressProfile2(profileInput);
  const plans: TrapPlan2[] = [];
  for (const page of document.pages) {
    for (const object of page.objects) {
      const fillTotal = inkTotal(object.fill?.colorants);
      const strokeTotal = inkTotal(object.stroke?.colorants);
      if (object.fill?.overprint || object.stroke?.overprint) plans.push({ objectId: object.id, pageId: page.id, mode: "none", width: 0, reason: "Object already uses overprint." });
      else if (fillTotal === 0 && strokeTotal === 0) plans.push({ objectId: object.id, pageId: page.id, mode: "none", width: 0, reason: "Object has no printable colorants." });
      else if (object.kind === "text" && object.text && object.text.fontSize < 12) plans.push({ objectId: object.id, pageId: page.id, mode: "choke", width: profile.defaultTrapWidth * 0.75, reason: "Small text receives a conservative choke." });
      else plans.push({ objectId: object.id, pageId: page.id, mode: "spread", width: profile.defaultTrapWidth, reason: "Standard automatic spread trap." });
    }
  }
  return plans;
}

export function buildSeparationPlates2(document: PrepressDocument2): SeparationPlate2[] {
  const plateMap = new Map<string, SeparationPlate2>();
  const colorantType = new Map((document.colorants ?? []).map(c => [c.name, c.type] as const));
  for (const page of document.pages) {
    for (const object of page.objects) {
      for (const paint of [object.fill, object.stroke]) {
        if (!paint) continue;
        for (const [name, value] of Object.entries(paint.colorants)) {
          const amount = clamp(Number(value ?? 0), 0, 100);
          if (amount <= 0) continue;
          const plate = plateMap.get(name) ?? { name, type: ["C", "M", "Y", "K"].includes(name) ? "process" : (colorantType.get(name) ?? "spot"), objectIds: [], coveragePercent: 0, overprintObjectIds: [] };
          if (!plate.objectIds.includes(object.id)) plate.objectIds.push(object.id);
          plate.coveragePercent += amount;
          if (paint.overprint && !plate.overprintObjectIds.includes(object.id)) plate.overprintObjectIds.push(object.id);
          plateMap.set(name, plate);
        }
      }
    }
  }
  return [...plateMap.values()].map(p => ({ ...p, coveragePercent: Math.round((p.coveragePercent / Math.max(1, p.objectIds.length)) * 100) / 100 })).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildProofPlan2(document: PrepressDocument2, profileInput: PressProfile2) {
  const profile = normalizePressProfile2(profileInput);
  const issues = inspectPrepressDocument2(document, profile);
  const plates = buildSeparationPlates2(document);
  return {
    version: "65.0" as const,
    documentId: document.id,
    profile,
    simulatePaper: true,
    simulateBlackInk: true,
    showOverprint: true,
    showInkLimit: true,
    plates,
    issues,
    ready: !issues.some(i => i.severity === "error"),
  };
}

export function certifyPrepress2(document: PrepressDocument2, profileInput: PressProfile2, certifiedAt = new Date().toISOString()): PrepressCertificate2 {
  const profile = normalizePressProfile2(profileInput);
  const issues = inspectPrepressDocument2(document, profile);
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const summary = [
    `${document.pages.length} page(s) inspected`,
    `${buildSeparationPlates2(document).length} separation plate(s)`,
    `${errorCount} error(s)`,
    `${warningCount} warning(s)`,
  ];
  return {
    version: "65.0",
    documentId: document.id,
    profileId: profile.id,
    certifiedAt,
    passed: errorCount === 0,
    errorCount,
    warningCount,
    checksum: hash(JSON.stringify({ document, profile, issues, certifiedAt })),
    summary,
  };
}

export function buildPrepressWorkflow2(document: PrepressDocument2, profileInput: PressProfile2) {
  const profile = normalizePressProfile2(profileInput);
  const issues = inspectPrepressDocument2(document, profile);
  return {
    version: "65.0" as const,
    documentId: document.id,
    profile,
    issues,
    traps: buildTrapPlan2(document, profile),
    plates: buildSeparationPlates2(document),
    ready: !issues.some(i => i.severity === "error"),
    pipeline: ["document-preflight", "font-check", "image-check", "bleed-safe-zone", "ink-limit", "overprint", "trapping", "separations", "soft-proof", "production-certification"],
  };
}
