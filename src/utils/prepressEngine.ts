import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type PrintColorIntent = "relative" | "perceptual" | "saturation" | "absolute";
export type ImpositionMode = "none" | "booklet" | "two-up" | "four-up" | "step-repeat";
export type DuplexMode = "simplex" | "long-edge" | "short-edge";
export type PrepressSeverity = "info" | "warning" | "error";
export type ProofMode = "composite" | "separation" | "overprint" | "gamut";
export type FinishingOperation = "none" | "fold" | "score" | "perforate" | "die-cut" | "foil" | "varnish" | "emboss";
export type PressType = "digital" | "sheetfed-offset" | "web-offset" | "wide-format";
export type SubstrateType = "coated" | "uncoated" | "newsprint" | "synthetic" | "board";
export type ApprovalStatus = "draft" | "internal-approved" | "client-approved" | "press-approved";

export type PrepressSettings = {
  outputProfile: "sRGB" | "Display P3" | "US Web Coated SWOP" | "FOGRA39" | "Japan Color 2001";
  convertToCmyk: boolean;
  preserveSpotColors: boolean;
  renderingIntent: PrintColorIntent;
  richBlack: boolean;
  inkLimit: number;
  overprintBlack: boolean;
  flattenTransparency: boolean;
  transparencyDpi: number;
  includeBleed: boolean;
  bleedOverride?: number;
  cropMarks: boolean;
  bleedMarks: boolean;
  registrationMarks: boolean;
  colorBars: boolean;
  pageInformation: boolean;
  markOffset: number;
  imposition: ImpositionMode;
  duplex: DuplexMode;
  binding: "left" | "right" | "top";
  signatureSize: 4 | 8 | 12 | 16 | 24 | 32;
  creep: number;
  gutter: number;
  copies: number;
  collate: boolean;
  reverseOrder: boolean;
  paperWidth?: number;
  paperHeight?: number;
  scaleMode: "actual" | "fit" | "fill" | "custom";
  customScale: number;
  minimumImageDpi: number;
  requireEmbeddedFonts: boolean;
  pdfStandard: "PDF" | "PDF/X-1a" | "PDF/X-3" | "PDF/X-4";
  generateSeparations: boolean;
  simulateOverprint: boolean;
  trapping: boolean;
  trapWidth: number;
  knockoutWhite: boolean;
  includeSlug: boolean;
  slugSize: number;
  includeJobTicket: boolean;
  proofMode: ProofMode;
  activeProofPlate: "Composite" | "Cyan" | "Magenta" | "Yellow" | "Black";
  showGamutWarnings: boolean;
  simulatePaperColor: boolean;
  simulateBlackInk: boolean;
  finishingOperations: FinishingOperation[];
  dielineRequired: boolean;
  dielineSpotName: string;
  dielineOverprint: boolean;
  minimumLineWidth: number;
  barcodeQuietZoneCheck: boolean;
  pressType: PressType;
  substrate: SubstrateType;
  screenFrequency: number;
  dotGain: number;
  minimumTextSize: number;
  minimumReverseTextSize: number;
  enforceHairlineMinimum: boolean;
  requireBlackTextOverprint: boolean;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvalTimestamp?: number;
};

export type PrepressIssue = {
  id: string;
  code: string;
  severity: PrepressSeverity;
  message: string;
  pageId?: string;
  elementId?: string;
};

export type ImposedSlot = {
  sheet: number;
  side: "front" | "back";
  slot: number;
  pageNumber: number | null;
  rotation: 0 | 90 | 180 | 270;
};

export type SeparationPlate = {
  name: "Cyan" | "Magenta" | "Yellow" | "Black" | string;
  kind: "process" | "spot";
  used: boolean;
  objectCount: number;
  maximumCoverage: number;
};

export type InkCoverageSummary = {
  maximumTotalInk: number;
  averageTotalInk: number;
  objectsOverLimit: number;
  sampledObjects: number;
};

export type SoftProofSummary = {
  mode: ProofMode;
  activePlate: PrepressSettings["activeProofPlate"];
  outOfGamutColors: number;
  simulatedPaper: boolean;
  simulatedBlackInk: boolean;
};

export type FinishingSummary = {
  operations: FinishingOperation[];
  dielineObjects: number;
  foldObjects: number;
  perforationObjects: number;
  foilObjects: number;
  varnishObjects: number;
};

export type ImpositionSheet = {
  sheet: number;
  side: "front" | "back";
  width: number;
  height: number;
  slots: Array<ImposedSlot & { x: number; y: number; width: number; height: number }>;
};

export type ProductionPackageManifest = {
  projectName: string;
  generatedAt: number;
  pdfStandard: PrepressSettings["pdfStandard"];
  outputProfile: PrepressSettings["outputProfile"];
  pageCount: number;
  sheetCount: number;
  plates: string[];
  fonts: string[];
  linkedImages: string[];
  marks: string[];
  ready: boolean;
  finishing: FinishingOperation[];
  proofMode: ProofMode;
};

export type PressReadinessSummary = {
  pressType: PressType;
  substrate: SubstrateType;
  screenFrequency: number;
  dotGain: number;
  smallTextObjects: number;
  reverseTextObjects: number;
  hairlineObjects: number;
  fingerprint: string;
  certified: boolean;
  approvalStatus: ApprovalStatus;
};

export type PrepressReport = {
  generatedAt: number;
  issues: PrepressIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  ready: boolean;
  imposedSlots: ImposedSlot[];
  separations: SeparationPlate[];
  inkCoverage: InkCoverageSummary;
  manifest: ProductionPackageManifest;
  softProof: SoftProofSummary;
  finishing: FinishingSummary;
  impositionSheets: ImpositionSheet[];
  pressReadiness: PressReadinessSummary;
};

export const DEFAULT_PREPRESS_SETTINGS: PrepressSettings = {
  outputProfile: "US Web Coated SWOP",
  convertToCmyk: true,
  preserveSpotColors: true,
  renderingIntent: "relative",
  richBlack: true,
  inkLimit: 300,
  overprintBlack: true,
  flattenTransparency: false,
  transparencyDpi: 300,
  includeBleed: true,
  cropMarks: true,
  bleedMarks: false,
  registrationMarks: false,
  colorBars: false,
  pageInformation: true,
  markOffset: 12,
  imposition: "none",
  duplex: "simplex",
  binding: "left",
  signatureSize: 16,
  creep: 0,
  gutter: 18,
  copies: 1,
  collate: true,
  reverseOrder: false,
  scaleMode: "actual",
  customScale: 100,
  minimumImageDpi: 300,
  requireEmbeddedFonts: true,
  pdfStandard: "PDF/X-4",
  generateSeparations: true,
  simulateOverprint: true,
  trapping: false,
  trapWidth: 0.25,
  knockoutWhite: true,
  includeSlug: false,
  slugSize: 18,
  includeJobTicket: true,
  proofMode: "composite",
  activeProofPlate: "Composite",
  showGamutWarnings: true,
  simulatePaperColor: false,
  simulateBlackInk: true,
  finishingOperations: ["none"],
  dielineRequired: false,
  dielineSpotName: "CutContour",
  dielineOverprint: true,
  minimumLineWidth: 0.25,
  barcodeQuietZoneCheck: true,
  pressType: "sheetfed-offset",
  substrate: "coated",
  screenFrequency: 175,
  dotGain: 15,
  minimumTextSize: 6,
  minimumReverseTextSize: 8,
  enforceHairlineMinimum: true,
  requireBlackTextOverprint: true,
  approvalStatus: "draft",
};

export function getPrepressSettings(project: PublisherProject): PrepressSettings {
  return { ...DEFAULT_PREPRESS_SETTINGS, ...(project.prepressSettings ?? {}) };
}

export function updatePrepressSettings(project: PublisherProject, updates: Partial<PrepressSettings>): PublisherProject {
  return { ...project, updatedAt: Date.now(), prepressSettings: { ...getPrepressSettings(project), ...updates } };
}


function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function hexToCmyk(value?: string): { c: number; m: number; y: number; k: number } | null {
  if (!value || value === "transparent") return null;
  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split("").map((char) => char + char).join("");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(clamp(((1 - r - k) / (1 - k)) * 100)),
    m: Math.round(clamp(((1 - g - k) / (1 - k)) * 100)),
    y: Math.round(clamp(((1 - b - k) / (1 - k)) * 100)),
    k: Math.round(clamp(k * 100)),
  };
}

function elementColors(element: PublisherElement): string[] {
  const values = [element.fillColor, element.borderColor, element.textColor, element.svgFill, element.svgStroke, element.paragraphShading, element.paragraphBorderColor];
  if (element.fillGradient) values.push(element.fillGradient.startColor, element.fillGradient.endColor);
  return values.filter((value): value is string => Boolean(value && value !== "transparent"));
}

export function analyzeInkCoverage(project: PublisherProject, settings = getPrepressSettings(project)): InkCoverageSummary {
  const totals: number[] = [];
  for (const page of project.pages) {
    for (const element of page.elements) {
      if (element.hidden) continue;
      for (const color of elementColors(element)) {
        const cmyk = hexToCmyk(color);
        if (cmyk) totals.push(cmyk.c + cmyk.m + cmyk.y + cmyk.k);
      }
    }
  }
  return {
    maximumTotalInk: totals.length ? Math.max(...totals) : 0,
    averageTotalInk: totals.length ? Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length) : 0,
    objectsOverLimit: totals.filter((value) => value > settings.inkLimit).length,
    sampledObjects: totals.length,
  };
}

export function buildColorSeparations(project: PublisherProject): SeparationPlate[] {
  const process = [
    { name: "Cyan" as const, key: "c" as const },
    { name: "Magenta" as const, key: "m" as const },
    { name: "Yellow" as const, key: "y" as const },
    { name: "Black" as const, key: "k" as const },
  ];
  const plates = process.map(({ name, key }) => ({ name, kind: "process" as const, used: false, objectCount: 0, maximumCoverage: 0 }));
  for (const page of project.pages) {
    for (const element of page.elements) {
      if (element.hidden) continue;
      for (const color of elementColors(element)) {
        const cmyk = hexToCmyk(color);
        if (!cmyk) continue;
        process.forEach(({ key }, index) => {
          const coverage = cmyk[key];
          if (coverage > 0) {
            plates[index].used = true;
            plates[index].objectCount += 1;
            plates[index].maximumCoverage = Math.max(plates[index].maximumCoverage, coverage);
          }
        });
      }
    }
  }
  return plates;
}

export function buildProductionManifest(project: PublisherProject, settings: PrepressSettings, reportData: { ready: boolean; imposedSlots: ImposedSlot[]; separations: SeparationPlate[] }): ProductionPackageManifest {
  const fonts = new Set<string>();
  const images = new Set<string>();
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.fontFamily) fonts.add(element.fontFamily);
    if (element.type === "image" && element.imageUri) images.add(element.imageUri);
  }));
  const marks = [
    settings.cropMarks && "Crop marks",
    settings.bleedMarks && "Bleed marks",
    settings.registrationMarks && "Registration marks",
    settings.colorBars && "Color bars",
    settings.pageInformation && "Page information",
    settings.includeSlug && "Slug area",
  ].filter((value): value is string => Boolean(value));
  return {
    projectName: project.name,
    generatedAt: Date.now(),
    pdfStandard: settings.pdfStandard,
    outputProfile: settings.outputProfile,
    pageCount: project.pages.length,
    sheetCount: new Set(reportData.imposedSlots.map((slot) => slot.sheet)).size,
    plates: reportData.separations.filter((plate) => plate.used).map((plate) => plate.name),
    fonts: [...fonts].sort(),
    linkedImages: [...images].sort(),
    marks,
    ready: reportData.ready,
    finishing: settings.finishingOperations,
    proofMode: settings.proofMode,
  };
}

function issue(code: string, severity: PrepressSeverity, message: string, pageId?: string, elementId?: string): PrepressIssue {
  return { id: `${code}-${pageId ?? "project"}-${elementId ?? "all"}`, code, severity, message, pageId, elementId };
}

function touchesTrim(element: PublisherElement, page: PublisherPage, tolerance = 1): boolean {
  return element.x <= tolerance || element.y <= tolerance || element.x + element.width >= page.width - tolerance || element.y + element.height >= page.height - tolerance;
}

function extendsIntoBleed(element: PublisherElement, page: PublisherPage): boolean {
  const bleed = Math.max(0, page.bleed);
  return element.x <= -bleed || element.y <= -bleed || element.x + element.width >= page.width + bleed || element.y + element.height >= page.height + bleed;
}

export function buildBookletImposition(pageCount: number, signatureSize = 16, binding: PrepressSettings["binding"] = "left"): ImposedSlot[] {
  const normalizedSignature = Math.max(4, Math.ceil(signatureSize / 4) * 4);
  const padded = Math.ceil(Math.max(pageCount, 1) / normalizedSignature) * normalizedSignature;
  const slots: ImposedSlot[] = [];
  let sheet = 1;
  for (let signatureStart = 1; signatureStart <= padded; signatureStart += normalizedSignature) {
    let low = signatureStart;
    let high = signatureStart + normalizedSignature - 1;
    while (low < high) {
      const front = binding === "right" ? [low, high] : [high, low];
      const back = binding === "right" ? [high - 1, low + 1] : [low + 1, high - 1];
      front.forEach((pageNumber, slot) => slots.push({ sheet, side: "front", slot, pageNumber: pageNumber <= pageCount ? pageNumber : null, rotation: binding === "top" ? 90 : 0 }));
      back.forEach((pageNumber, slot) => slots.push({ sheet, side: "back", slot, pageNumber: pageNumber <= pageCount ? pageNumber : null, rotation: binding === "top" ? 90 : 0 }));
      low += 2;
      high -= 2;
      sheet += 1;
    }
  }
  return slots;
}

export function buildNUpImposition(pageCount: number, mode: Exclude<ImpositionMode, "none" | "booklet">): ImposedSlot[] {
  const perSide = mode === "two-up" ? 2 : 4;
  const slots: ImposedSlot[] = [];
  for (let index = 0; index < pageCount; index += perSide) {
    const sheet = Math.floor(index / perSide) + 1;
    for (let slot = 0; slot < perSide; slot += 1) {
      const pageNumber = index + slot + 1;
      slots.push({ sheet, side: "front", slot, pageNumber: pageNumber <= pageCount ? pageNumber : null, rotation: 0 });
    }
  }
  return slots;
}

export function buildImposition(project: PublisherProject, settings = getPrepressSettings(project)): ImposedSlot[] {
  if (settings.imposition === "booklet") return buildBookletImposition(project.pages.length, settings.signatureSize, settings.binding);
  if (settings.imposition === "two-up" || settings.imposition === "four-up" || settings.imposition === "step-repeat") return buildNUpImposition(project.pages.length, settings.imposition);
  return project.pages.map((_, index) => ({ sheet: index + 1, side: "front" as const, slot: 0, pageNumber: index + 1, rotation: 0 as const }));
}


function isLikelyOutOfGamut(color: string, profile: PrepressSettings["outputProfile"]): boolean {
  if (profile === "sRGB" || profile === "Display P3") return false;
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return false;
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max > 235 && min < 30 && max - min > 210;
}

export function analyzeSoftProof(project: PublisherProject, settings = getPrepressSettings(project)): SoftProofSummary {
  let outOfGamutColors = 0;
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.hidden) return;
    elementColors(element).forEach((color) => { if (isLikelyOutOfGamut(color, settings.outputProfile)) outOfGamutColors += 1; });
  }));
  return { mode: settings.proofMode, activePlate: settings.activeProofPlate, outOfGamutColors, simulatedPaper: settings.simulatePaperColor, simulatedBlackInk: settings.simulateBlackInk };
}

function normalizedName(element: PublisherElement): string {
  return element.name.trim().toLowerCase();
}

export function analyzeFinishing(project: PublisherProject, settings = getPrepressSettings(project)): FinishingSummary {
  let dielineObjects = 0;
  let foldObjects = 0;
  let perforationObjects = 0;
  let foilObjects = 0;
  let varnishObjects = 0;
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.hidden) return;
    const name = normalizedName(element);
    if (name.includes("dieline") || name.includes("die cut") || name.includes("cutcontour") || name.includes(settings.dielineSpotName.toLowerCase())) dielineObjects += 1;
    if (name.includes("fold") || name.includes("score")) foldObjects += 1;
    if (name.includes("perf")) perforationObjects += 1;
    if (name.includes("foil")) foilObjects += 1;
    if (name.includes("varnish") || name.includes("spot uv")) varnishObjects += 1;
  }));
  return { operations: settings.finishingOperations, dielineObjects, foldObjects, perforationObjects, foilObjects, varnishObjects };
}

export function buildImpositionSheets(project: PublisherProject, settings = getPrepressSettings(project), slots = buildImposition(project, settings)): ImpositionSheet[] {
  const page = project.pages[0];
  const pageWidth = page?.width ?? 612;
  const pageHeight = page?.height ?? 792;
  const perSide = settings.imposition === "four-up" || settings.imposition === "step-repeat" ? 4 : settings.imposition === "two-up" || settings.imposition === "booklet" ? 2 : 1;
  const columns = perSide === 4 ? 2 : perSide === 2 ? 2 : 1;
  const rows = perSide === 4 ? 2 : 1;
  const sheetWidth = settings.paperWidth ?? columns * pageWidth + Math.max(0, columns - 1) * settings.gutter;
  const sheetHeight = settings.paperHeight ?? rows * pageHeight + Math.max(0, rows - 1) * settings.gutter;
  const grouped = new Map<string, ImpositionSheet>();
  slots.forEach((slot) => {
    const key = `${slot.sheet}-${slot.side}`;
    const sheet = grouped.get(key) ?? { sheet: slot.sheet, side: slot.side, width: sheetWidth, height: sheetHeight, slots: [] };
    const column = slot.slot % columns;
    const row = Math.floor(slot.slot / columns);
    sheet.slots.push({ ...slot, x: column * (pageWidth + settings.gutter), y: row * (pageHeight + settings.gutter), width: pageWidth, height: pageHeight });
    grouped.set(key, sheet);
  });
  return [...grouped.values()].sort((a, b) => a.sheet - b.sheet || a.side.localeCompare(b.side));
}


function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export function buildProductionFingerprint(project: PublisherProject, settings = getPrepressSettings(project)): string {
  const payload = JSON.stringify({
    id: project.id, name: project.name, updatedAt: project.updatedAt,
    pages: project.pages.map((page) => ({ id: page.id, width: page.width, height: page.height, bleed: page.bleed, elements: page.elements.map((element) => ({ id: element.id, type: element.type, x: element.x, y: element.y, width: element.width, height: element.height, rotation: element.rotation, fillColor: element.fillColor, textColor: element.textColor, fontFamily: element.fontFamily, fontSize: element.fontSize })) })),
    outputProfile: settings.outputProfile, pdfStandard: settings.pdfStandard, pressType: settings.pressType, substrate: settings.substrate, finishing: settings.finishingOperations,
  });
  return `YP-${stableHash(payload)}`;
}

export function analyzePressReadiness(project: PublisherProject, settings = getPrepressSettings(project)): PressReadinessSummary {
  let smallTextObjects = 0;
  let reverseTextObjects = 0;
  let hairlineObjects = 0;
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.hidden) return;
    if (element.type === "text") {
      const size = element.fontSize ?? 12;
      if (size < settings.minimumTextSize) smallTextObjects += 1;
      const reverse = Boolean(element.textColor && element.textColor.toLowerCase() === "#ffffff" && element.fillColor && element.fillColor !== "transparent" && element.fillColor.toLowerCase() !== "#ffffff");
      if (reverse && size < settings.minimumReverseTextSize) reverseTextObjects += 1;
    }
    const lineWidth = element.borderWidth ?? 0;
    if ((element.type === "line" || lineWidth > 0) && lineWidth > 0 && lineWidth < settings.minimumLineWidth) hairlineObjects += 1;
  }));
  const certified = settings.approvalStatus === "press-approved" && smallTextObjects === 0 && reverseTextObjects === 0 && (!settings.enforceHairlineMinimum || hairlineObjects === 0);
  return { pressType: settings.pressType, substrate: settings.substrate, screenFrequency: settings.screenFrequency, dotGain: settings.dotGain, smallTextObjects, reverseTextObjects, hairlineObjects, fingerprint: buildProductionFingerprint(project, settings), certified, approvalStatus: settings.approvalStatus };
}

export function runPrepress(project: PublisherProject, settings = getPrepressSettings(project)): PrepressReport {
  const issues: PrepressIssue[] = [];
  if (settings.convertToCmyk && project.colorMode !== "CMYK") issues.push(issue("DOCUMENT_RGB", "warning", "Document is RGB and will be converted to CMYK during print output."));
  if (settings.pdfStandard === "PDF/X-1a" && !settings.flattenTransparency) issues.push(issue("PDFX1A_TRANSPARENCY", "error", "PDF/X-1a requires transparency flattening."));
  if (settings.inkLimit < 200 || settings.inkLimit > 400) issues.push(issue("INK_LIMIT", "warning", "Total ink limit should normally be between 200% and 400%."));
  if (settings.includeBleed && project.pages.some((page) => page.bleed <= 0)) issues.push(issue("MISSING_DOCUMENT_BLEED", "error", "One or more pages have no bleed configured."));
  if (settings.imposition === "booklet" && project.pages.length % 4 !== 0) issues.push(issue("BOOKLET_BLANKS", "info", "Blank pages will be inserted so the booklet page count is divisible by four."));

  for (const page of project.pages) {
    if (page.width <= 0 || page.height <= 0) issues.push(issue("INVALID_PAGE_SIZE", "error", `Page “${page.name}” has an invalid size.`, page.id));
    for (const element of page.elements) {
      if (element.hidden) continue;
      if (element.type === "text") {
        const font = typeof element.fontFamily === "string" ? element.fontFamily.trim() : undefined;
        if (settings.requireEmbeddedFonts && font && !project.embeddedFonts?.[font] && !["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"].includes(font)) {
          issues.push(issue("FONT_NOT_EMBEDDED", "error", `Font “${font}” is not embedded.`, page.id, element.id));
        }
        if (element.oversetText) issues.push(issue("OVERSET_TEXT", "error", `Text frame “${element.name}” contains overset text.`, page.id, element.id));
      }
      if (element.type === "image") {
        if (!element.imageUri) issues.push(issue("MISSING_IMAGE", "error", `Image “${element.name}” is missing its source.`, page.id, element.id));
        if (touchesTrim(element, page) && settings.includeBleed && !extendsIntoBleed(element, page)) issues.push(issue("IMAGE_NO_BLEED", "warning", `Image “${element.name}” touches trim but does not extend through bleed.`, page.id, element.id));
      }
      if ((element.opacity ?? 1) < 1 && settings.pdfStandard === "PDF/X-1a" && !settings.flattenTransparency) issues.push(issue("LIVE_TRANSPARENCY", "error", `Object “${element.name}” uses live transparency.`, page.id, element.id));
      if (element.hidden) issues.push(issue("HIDDEN_OBJECT", "info", `Object “${element.name}” is hidden and will not print.`, page.id, element.id));
      if (element.x + element.width < -page.bleed || element.y + element.height < -page.bleed || element.x > page.width + page.bleed || element.y > page.height + page.bleed) {
        issues.push(issue("OFF_PAGE_OBJECT", "info", `Object “${element.name}” is outside the printable page area.`, page.id, element.id));
      }
    }
  }

  const inkCoverage = analyzeInkCoverage(project, settings);
  if (inkCoverage.objectsOverLimit > 0) issues.push(issue("INK_COVERAGE_EXCEEDED", "error", `${inkCoverage.objectsOverLimit} sampled color values exceed the ${settings.inkLimit}% total ink limit.`));
  if (settings.trapping && (settings.trapWidth <= 0 || settings.trapWidth > 2)) issues.push(issue("INVALID_TRAP_WIDTH", "warning", "Trap width should normally be greater than 0 and no more than 2 points."));
  if (settings.registrationMarks && settings.markOffset < 6) issues.push(issue("MARK_OFFSET_TOO_SMALL", "warning", "Registration marks may overlap bleed because the mark offset is below 6 points."));
  if (settings.includeSlug && settings.slugSize < 12) issues.push(issue("SLUG_TOO_SMALL", "warning", "Slug area should normally be at least 12 points."));
  if (settings.generateSeparations && !settings.convertToCmyk) issues.push(issue("SEPARATIONS_RGB_OUTPUT", "warning", "Color separations are enabled while CMYK conversion is disabled."));
  const softProof = analyzeSoftProof(project, settings);
  if (settings.showGamutWarnings && softProof.outOfGamutColors > 0) issues.push(issue("OUT_OF_GAMUT_COLORS", "warning", `${softProof.outOfGamutColors} saturated colors may shift in the selected press profile.`));
  const finishing = analyzeFinishing(project, settings);
  if (settings.dielineRequired && finishing.dielineObjects === 0) issues.push(issue("MISSING_DIELINE", "error", `A dieline named “${settings.dielineSpotName}” is required but was not found.`));
  if (settings.finishingOperations.includes("fold") && finishing.foldObjects === 0) issues.push(issue("MISSING_FOLD_GUIDE", "warning", "Fold finishing is enabled but no fold or score guide was detected."));
  if (settings.finishingOperations.includes("perforate") && finishing.perforationObjects === 0) issues.push(issue("MISSING_PERFORATION", "warning", "Perforation finishing is enabled but no perforation object was detected."));
  if (settings.minimumLineWidth <= 0 || settings.minimumLineWidth > 2) issues.push(issue("LINE_WIDTH_STANDARD", "warning", "Minimum production line width should normally be greater than 0 and no more than 2 points."));
  const pressReadiness = analyzePressReadiness(project, settings);
  if (settings.screenFrequency < 65 || settings.screenFrequency > 300) issues.push(issue("SCREEN_FREQUENCY", "warning", "Screen frequency should normally be between 65 and 300 LPI."));
  if (settings.dotGain < 0 || settings.dotGain > 35) issues.push(issue("DOT_GAIN", "warning", "Dot gain should normally be between 0% and 35%."));
  if (pressReadiness.smallTextObjects > 0) issues.push(issue("SMALL_TEXT", "warning", `${pressReadiness.smallTextObjects} text objects are below the ${settings.minimumTextSize} pt minimum.`));
  if (pressReadiness.reverseTextObjects > 0) issues.push(issue("SMALL_REVERSE_TEXT", "error", `${pressReadiness.reverseTextObjects} reversed text objects are below the ${settings.minimumReverseTextSize} pt minimum.`));
  if (settings.enforceHairlineMinimum && pressReadiness.hairlineObjects > 0) issues.push(issue("HAIRLINE_TOO_THIN", "error", `${pressReadiness.hairlineObjects} strokes are below the ${settings.minimumLineWidth} pt production minimum.`));
  if (settings.approvalStatus === "press-approved" && !settings.approvedBy) issues.push(issue("APPROVER_MISSING", "warning", "Press approval is selected but no approver is recorded."));
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  const infoCount = issues.filter((item) => item.severity === "info").length;
  const ready = errorCount === 0;
  const imposedSlots = buildImposition(project, settings);
  const separations = buildColorSeparations(project);
  const manifest = buildProductionManifest(project, settings, { ready, imposedSlots, separations });
  const impositionSheets = buildImpositionSheets(project, settings, imposedSlots);
  return { generatedAt: Date.now(), issues, errorCount, warningCount, infoCount, ready, imposedSlots, separations, inkCoverage, manifest, softProof, finishing, impositionSheets, pressReadiness: { ...pressReadiness, certified: ready && settings.approvalStatus === "press-approved" } };
}

export function applyPrintPreset(project: PublisherProject, preset: "commercial" | "desktop" | "booklet" | "proof"): PublisherProject {
  const presets: Record<typeof preset, Partial<PrepressSettings>> = {
    commercial: { pdfStandard: "PDF/X-4", convertToCmyk: true, includeBleed: true, cropMarks: true, minimumImageDpi: 300, outputProfile: "US Web Coated SWOP" },
    desktop: { pdfStandard: "PDF", convertToCmyk: false, includeBleed: false, cropMarks: false, minimumImageDpi: 150, outputProfile: "sRGB" },
    booklet: { pdfStandard: "PDF/X-4", convertToCmyk: true, includeBleed: true, cropMarks: true, imposition: "booklet", duplex: "short-edge", signatureSize: 16 },
    proof: { pdfStandard: "PDF", convertToCmyk: false, includeBleed: true, cropMarks: true, colorBars: true, pageInformation: true, minimumImageDpi: 150 },
  };
  return updatePrepressSettings(project, presets[preset]);
}
