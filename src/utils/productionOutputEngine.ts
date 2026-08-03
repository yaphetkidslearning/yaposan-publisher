import type { PublisherPage, PublisherProject } from "../types/publisher";
import { pageToSvg } from "./pageSvgExport";
import { buildImpositionSheets, getPrepressSettings, runPrepress, type ImpositionSheet, type PrepressSettings } from "./prepressEngine";

export type ProductionArtifactKind = "composite" | "separation" | "finishing" | "imposition" | "job-ticket" | "preflight" | "manifest" | "checksum";
export type ProductionArtifact = { path: string; mimeType: string; kind: ProductionArtifactKind; content: string };
export type PdfXReadiness = { standard: PrepressSettings["pdfStandard"]; compliant: boolean; outputIntent: string; requiredBoxes: string[]; failures: string[] };
export type ProductionOutputPlan = {
  generatedAt: number;
  jobId: string;
  settings: PrepressSettings;
  pdfx: PdfXReadiness;
  sheets: ImpositionSheet[];
  artifacts: ProductionArtifact[];
  checksums: Record<string, string>;
  blocked: boolean;
};

const safe = (value: string) => value.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "publication";
const esc = (value: unknown) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

export function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function plateFilter(name: string): string {
  const filters: Record<string, string> = {
    Cyan: "<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 .68  0 0 0 0 .78  0 0 0 1 0\"/>",
    Magenta: "<feColorMatrix type=\"matrix\" values=\"0 0 0 0 .75  0 0 0 0 0  0 0 0 0 .55  0 0 0 1 0\"/>",
    Yellow: "<feColorMatrix type=\"matrix\" values=\"0 0 0 0 .85  0 0 0 0 .75  0 0 0 0 0  0 0 0 1 0\"/>",
    Black: "<feColorMatrix type=\"saturate\" values=\"0\"/>",
  };
  return filters[name] ?? "<feColorMatrix type=\"saturate\" values=\"0\"/>";
}

function addProductionMarks(svg: string, page: PublisherPage, settings: PrepressSettings, label: string): string {
  const bleed = settings.includeBleed ? (settings.bleedOverride ?? page.bleed ?? 9) : 0;
  const offset = Math.max(settings.markOffset, 6);
  const w = page.width, h = page.height;
  const marks: string[] = [];
  if (settings.cropMarks) marks.push(`<path d="M${-offset} 0H-2 M0 ${-offset}V-2 M${w+2} 0H${w+offset} M${w} ${-offset}V-2 M${-offset} ${h}H-2 M0 ${h+2}V${h+offset} M${w+2} ${h}H${w+offset} M${w} ${h+2}V${h+offset}" stroke="#000" fill="none" stroke-width=".5"/>`);
  if (settings.bleedMarks && bleed > 0) marks.push(`<rect x="${-bleed}" y="${-bleed}" width="${w+bleed*2}" height="${h+bleed*2}" fill="none" stroke="#000" stroke-width=".35" stroke-dasharray="3 2"/>`);
  if (settings.registrationMarks) [[-offset,h/2],[w+offset,h/2],[w/2,-offset],[w/2,h+offset]].forEach(([x,y])=>marks.push(`<g transform="translate(${x} ${y})"><circle r="5" fill="none" stroke="#000" stroke-width=".5"/><path d="M-8 0H8M0-8V8" stroke="#000" stroke-width=".5"/></g>`));
  if (settings.colorBars) marks.push(`<g transform="translate(0 ${h+offset})">${["#00AEEF","#EC008C","#FFF200","#000000","#808080"].map((c,i)=>`<rect x="${i*22}" y="0" width="20" height="8" fill="${c}"/>`).join("")}</g>`);
  if (settings.pageInformation || settings.includeSlug) marks.push(`<text x="0" y="${h+offset+18}" font-family="Helvetica" font-size="8" fill="#000">${esc(label)} · ${esc(settings.pdfStandard)} · ${esc(settings.outputProfile)}</text>`);
  return svg.replace("</svg>", `<g id="yaposan-production-marks">${marks.join("")}</g></svg>`);
}

function pageSvg(page: PublisherPage, settings: PrepressSettings, label: string): string {
  const raw = pageToSvg(page, { hyperlinks: true, preserveText: true, preserveGradients: true });
  return addProductionMarks(raw, page, settings, label);
}

function separationSvg(page: PublisherPage, settings: PrepressSettings, plate: string): string {
  const svg = pageSvg(page, settings, `${page.name} · ${plate} plate`);
  return svg.replace("<svg ", `<svg data-plate="${esc(plate)}" `).replace(/(<svg[^>]*>)/, `$1<defs><filter id="plate">${plateFilter(plate)}</filter></defs><g filter="url(#plate)">`).replace("</svg>", "</g></svg>");
}

function finishingArtifacts(project: PublisherProject, settings: PrepressSettings): ProductionArtifact[] {
  const operations = settings.finishingOperations.filter((op) => op !== "none");
  return operations.flatMap((operation) => project.pages.map((page, index) => ({
    path: `finishing/${safe(operation)}-page-${index+1}.svg`, mimeType: "image/svg+xml", kind: "finishing" as const,
    content: `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}"><metadata>${esc(operation)} production plate; spot=${esc(operation === "die-cut" ? settings.dielineSpotName : operation)}</metadata><rect x=".5" y=".5" width="${page.width-1}" height="${page.height-1}" fill="none" stroke="#FF00FF" stroke-width="${Math.max(settings.minimumLineWidth,.25)}" data-overprint="true"/></svg>`
  })));
}

export function validatePdfXReadiness(project: PublisherProject, settings = getPrepressSettings(project)): PdfXReadiness {
  const report = runPrepress(project, settings);
  const failures: string[] = [];
  if (settings.pdfStandard !== "PDF" && !settings.convertToCmyk) failures.push("PDF/X output requires managed CMYK conversion.");
  if (settings.pdfStandard !== "PDF" && !settings.outputProfile) failures.push("PDF/X output requires an OutputIntent profile.");
  if (settings.pdfStandard === "PDF/X-1a" && !settings.flattenTransparency) failures.push("PDF/X-1a requires flattened transparency.");
  if (settings.requireEmbeddedFonts && report.issues.some((i) => i.code.includes("FONT") && i.severity === "error")) failures.push("All fonts must be embedded or outlined.");
  if (report.errorCount) failures.push(`${report.errorCount} blocking preflight issue(s) remain.`);
  return { standard: settings.pdfStandard, compliant: failures.length === 0, outputIntent: settings.outputProfile, requiredBoxes: ["MediaBox","TrimBox","BleedBox","ArtBox"], failures };
}

export function buildProductionOutputPlan(project: PublisherProject, settings = getPrepressSettings(project)): ProductionOutputPlan {
  const report = runPrepress(project, settings);
  const pdfx = validatePdfXReadiness(project, settings);
  const base = safe(project.name);
  const artifacts: ProductionArtifact[] = [];
  project.pages.forEach((page, index) => artifacts.push({ path:`composite/${base}-page-${index+1}.svg`, mimeType:"image/svg+xml", kind:"composite", content:pageSvg(page, settings, `${project.name} · Page ${index+1}`) }));
  if (settings.generateSeparations) report.separations.forEach((plate)=>project.pages.forEach((page,index)=>artifacts.push({ path:`separations/${safe(plate.name)}-page-${index+1}.svg`, mimeType:"image/svg+xml", kind:"separation", content:separationSvg(page,settings,plate.name) })));
  artifacts.push(...finishingArtifacts(project, settings));
  artifacts.push({ path:"reports/preflight.json", mimeType:"application/json", kind:"preflight", content:JSON.stringify(report,null,2) });
  artifacts.push({ path:"reports/job-ticket.json", mimeType:"application/json", kind:"job-ticket", content:JSON.stringify({ project:project.name, author:project.author, generatedAt:Date.now(), press:report.pressReadiness, settings, sheetCount:report.impositionSheets.length },null,2) });
  artifacts.push({ path:"reports/pdfx-readiness.json", mimeType:"application/json", kind:"preflight", content:JSON.stringify(pdfx,null,2) });
  artifacts.push({ path:"reports/imposition.json", mimeType:"application/json", kind:"imposition", content:JSON.stringify(report.impositionSheets,null,2) });
  const manifest = { version:"13.4", project:project.name, fingerprint:report.pressReadiness.fingerprint, pdfx, outputIntent:settings.outputProfile, artifacts:artifacts.map((a)=>({path:a.path,mimeType:a.mimeType,kind:a.kind})), finishing:report.finishing, separations:report.separations, approval:settings.approvalStatus };
  artifacts.push({ path:"manifest.json", mimeType:"application/json", kind:"manifest", content:JSON.stringify(manifest,null,2) });
  const checksums = Object.fromEntries(artifacts.map((a)=>[a.path,fnv1a(a.content)]));
  artifacts.push({ path:"checksums.json", mimeType:"application/json", kind:"checksum", content:JSON.stringify(checksums,null,2) });
  return { generatedAt:Date.now(), jobId:`${base}-${report.pressReadiness.fingerprint}`, settings, pdfx, sheets:report.impositionSheets, artifacts, checksums, blocked:report.errorCount>0 || !pdfx.compliant };
}

export function productionOutputSummary(plan: ProductionOutputPlan) {
  return { jobId:plan.jobId, artifactCount:plan.artifacts.length, separationFiles:plan.artifacts.filter((a)=>a.kind==="separation").length, finishingFiles:plan.artifacts.filter((a)=>a.kind==="finishing").length, imposedSheets:plan.sheets.length, pdfxReady:plan.pdfx.compliant, blocked:plan.blocked };
}
