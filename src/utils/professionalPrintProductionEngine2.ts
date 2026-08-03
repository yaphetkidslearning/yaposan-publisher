export type PrintProcess2 = "offset" | "digital" | "flexo" | "screen" | "large-format";
export type ProductionStatus2 = "draft" | "preflight" | "proof" | "approved" | "queued" | "printing" | "finishing" | "complete" | "held" | "failed";
export type DuplexMode2 = "simplex" | "long-edge" | "short-edge";
export type FinishingKind2 = "trim" | "fold" | "score" | "perforate" | "staple" | "saddle-stitch" | "perfect-bind" | "wire-bind" | "laminate" | "varnish" | "foil" | "die-cut" | "emboss" | "pack";

export type PrintDevice2 = {
  id: string;
  name: string;
  process: PrintProcess2;
  maxSheetWidth: number;
  maxSheetHeight: number;
  minSheetWidth?: number;
  minSheetHeight?: number;
  supportedColorModes: Array<"mono" | "cmyk" | "cmyk+spot">;
  supportedMedia: string[];
  maxGsm: number;
  maxResolutionDpi: number;
  duplex: boolean;
  variableData: boolean;
  hourlyThroughput: number;
  setupMinutes: number;
  costPerSheet: number;
  costPerSetup: number;
};

export type ProductionJob2 = {
  id: string;
  title: string;
  documentId: string;
  quantity: number;
  pageCount: number;
  trimWidth: number;
  trimHeight: number;
  bleed: number;
  colorMode: "mono" | "cmyk" | "cmyk+spot";
  media: { name: string; gsm: number; width: number; height: number };
  duplex: DuplexMode2;
  copiesPerSheet?: number;
  variableDataRecords?: number;
  outputProfile?: string;
  prepressPassed: boolean;
  proofApproved: boolean;
  dueAt?: string;
  priority?: number;
  finishing?: FinishingInstruction2[];
};

export type FinishingInstruction2 = {
  id: string;
  kind: FinishingKind2;
  sequence: number;
  parameters?: Record<string, string | number | boolean>;
  required?: boolean;
};

export type ProductionIssue2 = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  value?: string | number;
  limit?: string | number;
};

export type RipJobTicket2 = {
  version: "66.0";
  jobId: string;
  deviceId: string;
  resolutionDpi: number;
  screening: "am" | "fm" | "stochastic" | "device-default";
  colorManagement: { outputProfile?: string; preserveBlack: boolean; spotHandling: "preserve" | "convert" };
  media: ProductionJob2["media"];
  duplex: DuplexMode2;
  quantity: number;
  sheets: number;
  variableDataRecords: number;
  finishing: FinishingInstruction2[];
  checksum: string;
};

export type ProductionEstimate2 = {
  sheets: number;
  makeReadySheets: number;
  runMinutes: number;
  finishingMinutes: number;
  totalMinutes: number;
  materialCost: number;
  setupCost: number;
  finishingCost: number;
  estimatedCost: number;
};

export type ProductionCertificate2 = {
  version: "66.0";
  jobId: string;
  deviceId: string;
  certifiedAt: string;
  passed: boolean;
  errorCount: number;
  warningCount: number;
  status: ProductionStatus2;
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

export const DEFAULT_PRINT_DEVICES2: PrintDevice2[] = [
  { id: "digital-production", name: "Digital Production Press", process: "digital", maxSheetWidth: 330, maxSheetHeight: 700, minSheetWidth: 100, minSheetHeight: 148, supportedColorModes: ["mono", "cmyk"], supportedMedia: ["coated", "uncoated", "synthetic"], maxGsm: 400, maxResolutionDpi: 2400, duplex: true, variableData: true, hourlyThroughput: 1800, setupMinutes: 8, costPerSheet: 0.12, costPerSetup: 18 },
  { id: "offset-4c", name: "Four Color Offset Press", process: "offset", maxSheetWidth: 720, maxSheetHeight: 1020, minSheetWidth: 250, minSheetHeight: 350, supportedColorModes: ["cmyk", "cmyk+spot"], supportedMedia: ["coated", "uncoated", "board"], maxGsm: 600, maxResolutionDpi: 2540, duplex: false, variableData: false, hourlyThroughput: 9000, setupMinutes: 45, costPerSheet: 0.035, costPerSetup: 180 },
  { id: "wide-format", name: "Wide Format Printer", process: "large-format", maxSheetWidth: 1600, maxSheetHeight: 5000, minSheetWidth: 300, minSheetHeight: 300, supportedColorModes: ["cmyk", "cmyk+spot"], supportedMedia: ["vinyl", "banner", "paper", "fabric"], maxGsm: 900, maxResolutionDpi: 1440, duplex: false, variableData: true, hourlyThroughput: 80, setupMinutes: 12, costPerSheet: 4.5, costPerSetup: 25 },
];

export function normalizePrintDevice2(input: PrintDevice2): PrintDevice2 {
  return {
    ...input,
    id: input.id.trim() || "print-device",
    name: input.name.trim() || "Print Device",
    maxSheetWidth: clamp(input.maxSheetWidth, 50, 10000),
    maxSheetHeight: clamp(input.maxSheetHeight, 50, 20000),
    minSheetWidth: clamp(input.minSheetWidth ?? 1, 1, input.maxSheetWidth),
    minSheetHeight: clamp(input.minSheetHeight ?? 1, 1, input.maxSheetHeight),
    supportedColorModes: [...new Set(input.supportedColorModes)],
    supportedMedia: [...new Set(input.supportedMedia.map(v => v.trim().toLowerCase()).filter(Boolean))],
    maxGsm: clamp(input.maxGsm, 40, 2000),
    maxResolutionDpi: Math.round(clamp(input.maxResolutionDpi, 300, 9600)),
    hourlyThroughput: clamp(input.hourlyThroughput, 1, 100000),
    setupMinutes: clamp(input.setupMinutes, 0, 1440),
    costPerSheet: clamp(input.costPerSheet, 0, 10000),
    costPerSetup: clamp(input.costPerSetup, 0, 100000),
  };
}

export function inspectProductionJob2(job: ProductionJob2, deviceInput: PrintDevice2): ProductionIssue2[] {
  const device = normalizePrintDevice2(deviceInput);
  const issues: ProductionIssue2[] = [];
  if (!job.prepressPassed) issues.push({ severity: "error", code: "PREPRESS_NOT_PASSED", message: "The job has not passed prepress certification." });
  if (!job.proofApproved) issues.push({ severity: "error", code: "PROOF_NOT_APPROVED", message: "A production proof must be approved before printing." });
  if (job.quantity <= 0) issues.push({ severity: "error", code: "INVALID_QUANTITY", message: "Quantity must be greater than zero.", value: job.quantity });
  if (job.pageCount <= 0) issues.push({ severity: "error", code: "INVALID_PAGE_COUNT", message: "Page count must be greater than zero.", value: job.pageCount });
  if (!device.supportedColorModes.includes(job.colorMode)) issues.push({ severity: "error", code: "UNSUPPORTED_COLOR_MODE", message: "Selected device does not support the job color mode.", value: job.colorMode });
  const mediaName = job.media.name.trim().toLowerCase();
  if (!device.supportedMedia.includes(mediaName)) issues.push({ severity: "error", code: "UNSUPPORTED_MEDIA", message: "Selected device does not support the requested media.", value: mediaName });
  if (job.media.gsm > device.maxGsm) issues.push({ severity: "error", code: "MEDIA_TOO_HEAVY", message: "Media weight exceeds device capacity.", value: job.media.gsm, limit: device.maxGsm });
  if (job.media.width > device.maxSheetWidth || job.media.height > device.maxSheetHeight) issues.push({ severity: "error", code: "SHEET_TOO_LARGE", message: "Media dimensions exceed device capacity." });
  if (job.media.width < (device.minSheetWidth ?? 1) || job.media.height < (device.minSheetHeight ?? 1)) issues.push({ severity: "error", code: "SHEET_TOO_SMALL", message: "Media dimensions are below device minimum." });
  if (job.duplex !== "simplex" && !device.duplex) issues.push({ severity: "error", code: "DUPLEX_UNSUPPORTED", message: "Selected device does not support duplex printing." });
  if ((job.variableDataRecords ?? 0) > 0 && !device.variableData) issues.push({ severity: "error", code: "VARIABLE_DATA_UNSUPPORTED", message: "Selected device does not support variable-data production." });
  const imageWidth = job.trimWidth + job.bleed * 2;
  const imageHeight = job.trimHeight + job.bleed * 2;
  if (imageWidth > job.media.width || imageHeight > job.media.height) issues.push({ severity: "error", code: "ARTWORK_EXCEEDS_MEDIA", message: "Trim and bleed dimensions do not fit the selected media." });
  const sequences = (job.finishing ?? []).map(f => f.sequence);
  if (new Set(sequences).size !== sequences.length) issues.push({ severity: "warning", code: "FINISHING_SEQUENCE_CONFLICT", message: "Finishing steps contain duplicate sequence numbers." });
  if (job.dueAt && Number.isNaN(Date.parse(job.dueAt))) issues.push({ severity: "warning", code: "INVALID_DUE_DATE", message: "Due date is not a valid timestamp." });
  return issues;
}

export function routeProductionDevice2(job: ProductionJob2, devices: PrintDevice2[] = DEFAULT_PRINT_DEVICES2) {
  const candidates = devices.map(normalizePrintDevice2).map(device => {
    const issues = inspectProductionJob2(job, device);
    const errors = issues.filter(issue => issue.severity === "error").length;
    const variablePenalty = (job.variableDataRecords ?? 0) > 0 && !device.variableData ? 1000 : 0;
    const processPenalty = job.quantity >= 2000 && device.process !== "offset" ? 80 : job.quantity < 500 && device.process === "offset" ? 60 : 0;
    const score = errors * 10000 + variablePenalty + processPenalty + device.setupMinutes + device.costPerSheet * Math.max(1, job.quantity / Math.max(1, job.copiesPerSheet ?? 1));
    return { device, issues, eligible: errors === 0, score };
  }).sort((a, b) => a.score - b.score || a.device.id.localeCompare(b.device.id));
  return { selected: candidates.find(c => c.eligible)?.device, candidates };
}

export function estimateProduction2(job: ProductionJob2, deviceInput: PrintDevice2): ProductionEstimate2 {
  const device = normalizePrintDevice2(deviceInput);
  const impressionsPerCopy = Math.ceil(job.pageCount / (job.duplex === "simplex" ? 1 : 2));
  const copiesPerSheet = Math.max(1, Math.floor(job.copiesPerSheet ?? 1));
  const sheets = Math.ceil((job.quantity * impressionsPerCopy) / copiesPerSheet);
  const makeReadySheets = device.process === "offset" ? Math.max(100, Math.ceil(sheets * 0.02)) : Math.max(2, Math.ceil(sheets * 0.005));
  const runMinutes = (sheets / device.hourlyThroughput) * 60;
  const finishingMinutes = (job.finishing ?? []).reduce((sum, item) => sum + (item.required === false ? 0 : Math.max(2, job.quantity / 500)), 0);
  const totalMinutes = device.setupMinutes + runMinutes + finishingMinutes;
  const materialCost = (sheets + makeReadySheets) * device.costPerSheet;
  const setupCost = device.costPerSetup;
  const finishingCost = finishingMinutes * 0.75;
  return { sheets, makeReadySheets, runMinutes: Number(runMinutes.toFixed(2)), finishingMinutes: Number(finishingMinutes.toFixed(2)), totalMinutes: Number(totalMinutes.toFixed(2)), materialCost: Number(materialCost.toFixed(2)), setupCost: Number(setupCost.toFixed(2)), finishingCost: Number(finishingCost.toFixed(2)), estimatedCost: Number((materialCost + setupCost + finishingCost).toFixed(2)) };
}

export function buildRipJobTicket2(job: ProductionJob2, deviceInput: PrintDevice2): RipJobTicket2 {
  const device = normalizePrintDevice2(deviceInput);
  const issues = inspectProductionJob2(job, device);
  if (issues.some(issue => issue.severity === "error")) throw new Error(`Production job is not ready: ${issues.filter(i => i.severity === "error").map(i => i.code).join(", ")}`);
  const estimate = estimateProduction2(job, device);
  const resolutionDpi = Math.min(device.maxResolutionDpi, device.process === "large-format" ? 1200 : 2400);
  const base = {
    version: "66.0" as const,
    jobId: job.id,
    deviceId: device.id,
    resolutionDpi,
    screening: device.process === "offset" ? "am" as const : device.process === "flexo" ? "fm" as const : "device-default" as const,
    colorManagement: { outputProfile: job.outputProfile, preserveBlack: true, spotHandling: job.colorMode === "cmyk+spot" ? "preserve" as const : "convert" as const },
    media: { ...job.media },
    duplex: job.duplex,
    quantity: Math.max(1, Math.round(job.quantity)),
    sheets: estimate.sheets,
    variableDataRecords: Math.max(0, Math.round(job.variableDataRecords ?? 0)),
    finishing: [...(job.finishing ?? [])].sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id)),
  };
  return { ...base, checksum: hash(JSON.stringify(base)) };
}

export function buildProductionWorkflow2(job: ProductionJob2, devices: PrintDevice2[] = DEFAULT_PRINT_DEVICES2) {
  const routing = routeProductionDevice2(job, devices);
  const selected = routing.selected;
  const issues = selected ? inspectProductionJob2(job, selected) : [{ severity: "error", code: "NO_ELIGIBLE_DEVICE", message: "No eligible print device was found." } as ProductionIssue2];
  return {
    version: "66.0" as const,
    jobId: job.id,
    selectedDevice: selected,
    issues,
    ready: Boolean(selected) && !issues.some(issue => issue.severity === "error"),
    estimate: selected ? estimateProduction2(job, selected) : undefined,
    ticket: selected && !issues.some(issue => issue.severity === "error") ? buildRipJobTicket2(job, selected) : undefined,
    pipeline: ["prepress-certificate", "proof-approval", "device-routing", "media-planning", "rip-ticket", "print-queue", "press-run", "finishing", "quality-control", "packing", "production-certification"],
  };
}

export function certifyProduction2(job: ProductionJob2, deviceInput: PrintDevice2, certifiedAt = new Date().toISOString()): ProductionCertificate2 {
  const device = normalizePrintDevice2(deviceInput);
  const issues = inspectProductionJob2(job, device);
  const errorCount = issues.filter(issue => issue.severity === "error").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;
  const status: ProductionStatus2 = errorCount ? "held" : "queued";
  const summary = [
    `${job.quantity} copies across ${job.pageCount} page(s)`,
    `Device: ${device.name}`,
    `Errors: ${errorCount}; warnings: ${warningCount}`,
    `Status: ${status}`,
  ];
  return { version: "66.0", jobId: job.id, deviceId: device.id, certifiedAt, passed: errorCount === 0, errorCount, warningCount, status, checksum: hash(JSON.stringify({ job, device, issues, certifiedAt })), summary };
}
