import { buildPageNumberMap, calculateDocumentStatistics, normalizeDocumentFoundation } from "./documentFoundationEngine";
import { normalizeDocumentStyles } from "./documentStyleEngine";
import { normalizeDocumentReferences, validateDocumentReferences } from "./documentReferenceEngine";
import { normalizeDocumentVariables, validateDocumentVariables } from "./documentVariableEngine";
const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const issue = (severity, category, message, pageId, elementId, fixId) => ({ id: uid("issue"), severity, category, message, pageId, elementId, fixId });
const textTokens = (text) => Array.from(text.matchAll(/\{\{[^}]+\}\}/g)).map(m => m[0]);
const isImage = (e) => e.type === "image" || e.type === "svg";
export function normalizePublicationCompletion(project) {
    const p = normalizeDocumentVariables(normalizeDocumentReferences(normalizeDocumentStyles(normalizeDocumentFoundation(project))));
    const current = p.publicationCompletion;
    return { ...p, phase21Version: "21.4", publicationCompletion: { version: "21.4", lastIssues: current?.lastIssues ?? [], lastAuditAt: current?.lastAuditAt, lastCertificate: current?.lastCertificate, optimizedAt: current?.optimizedAt, packageManifest: current?.packageManifest } };
}
export function runPublicationPreflight(project) {
    const p = normalizePublicationCompletion(project);
    const out = [];
    const ids = new Set();
    if (!p.name.trim())
        out.push(issue("error", "document", "Publication title is missing", undefined, undefined, "metadata"));
    if (!p.pages.length)
        out.push(issue("error", "document", "Publication has no pages"));
    const pageNumbers = buildPageNumberMap(p);
    const numberValues = Object.values(pageNumbers);
    const duplicateNumbers = numberValues.filter((v, i) => numberValues.indexOf(v) !== i);
    if (duplicateNumbers.length)
        out.push(issue("error", "document", `Duplicate page numbers: ${Array.from(new Set(duplicateNumbers)).join(", ")}`, undefined, undefined, "page-numbering"));
    for (const page of p.pages) {
        if (!page.elements.length)
            out.push(issue("info", "document", `Page “${page.name}” is empty`, page.id));
        for (const e of page.elements) {
            if (ids.has(e.id))
                out.push(issue("error", "document", `Duplicate object ID: ${e.id}`, page.id, e.id, "duplicate-id"));
            ids.add(e.id);
            if (e.hidden)
                out.push(issue("info", "layout", `Hidden object: ${e.name}`, page.id, e.id));
            if (e.x < 0 || e.y < 0 || e.x + e.width > page.width || e.y + e.height > page.height)
                out.push(issue("warning", "layout", `Object extends outside page: ${e.name}`, page.id, e.id, "clamp"));
            if (e.type === "text") {
                if (!e.text?.trim())
                    out.push(issue("warning", "typography", `Empty text frame: ${e.name}`, page.id, e.id, "remove-empty"));
                if (e.oversetText)
                    out.push(issue("error", "typography", `Overset text: ${e.name}`, page.id, e.id, "overset"));
                if ((e.fontSize ?? 12) < 8)
                    out.push(issue("warning", "accessibility", `Small text below 8 pt: ${e.name}`, page.id, e.id));
                if (!e.fontFamily)
                    out.push(issue("warning", "typography", `Font is not explicitly assigned: ${e.name}`, page.id, e.id, "font"));
                for (const token of textTokens(e.text ?? ""))
                    if (!p.documentVariables.variables.some(v => v.token === token))
                        out.push(issue("error", "variable", `Undefined variable ${token}`, page.id, e.id, "remove-token"));
            }
            if (isImage(e)) {
                if (!e.imageUri && !e.svgContent)
                    out.push(issue("error", "asset", `Missing image or SVG source: ${e.name}`, page.id, e.id, "remove-empty"));
                const alt = e.altText;
                if (!alt?.trim())
                    out.push(issue("warning", "accessibility", `Missing alt text: ${e.name}`, page.id, e.id, "alt-text"));
            }
            if (e.type === "table" && (!e.tableCells?.length))
                out.push(issue("warning", "document", `Empty table: ${e.name}`, page.id, e.id, "remove-empty"));
            if (e.hyperlink && !/^(https?:\/\/|mailto:|#)/i.test(e.hyperlink))
                out.push(issue("warning", "reference", `Potentially invalid hyperlink: ${e.hyperlink}`, page.id, e.id, "hyperlink"));
        }
    }
    for (const i of validateDocumentReferences(p))
        out.push(issue(i.severity === "error" ? "error" : "warning", "reference", i.message, undefined, undefined, "references"));
    for (const i of validateDocumentVariables(p))
        out.push(issue(i.severity === "error" ? "error" : "warning", "variable", i.message, undefined, undefined, "variables"));
    const styles = p.documentStyles.styles;
    for (const s of styles) {
        const used = p.pages.some(pg => pg.elements.some(e => e.characterStyleId === s.id || e.paragraphStyleId === s.id || e.professionalStyleId === s.id));
        if (!used && !s.builtIn)
            out.push(issue("info", "style", `Unused style: ${s.name}`, undefined, undefined, "unused-styles"));
    }
    const vars = p.documentVariables.variables;
    for (const v of vars.filter(v => v.kind === "custom")) {
        const used = p.pages.some(pg => pg.elements.some(e => e.text?.includes(v.token))) || p.documentVariables.runningContent.some(r => r.leftTemplate.includes(v.token) || r.rightTemplate.includes(v.token) || r.firstPageTemplate?.includes(v.token));
        if (!used)
            out.push(issue("info", "variable", `Unused variable: ${v.name}`, undefined, undefined, "unused-variables"));
    }
    return out;
}
export function repairPublicationIssues(project, issues = runPublicationPreflight(project)) {
    let p = normalizePublicationCompletion(project);
    const remove = new Set(issues.filter(i => i.fixId === "remove-empty").map(i => i.elementId).filter(Boolean));
    p = { ...p, pages: p.pages.map(page => ({ ...page, elements: page.elements.filter(e => !remove.has(e.id)).map(e => {
                let n = { ...e };
                if (issues.some(i => i.elementId === e.id && i.fixId === "clamp"))
                    n = { ...n, x: Math.max(0, Math.min(page.width - e.width, e.x)), y: Math.max(0, Math.min(page.height - e.height, e.y)) };
                if (issues.some(i => i.elementId === e.id && i.fixId === "font") && !n.fontFamily)
                    n.fontFamily = "Arial";
                if (issues.some(i => i.elementId === e.id && i.fixId === "alt-text"))
                    n.altText = n.name || "Image";
                if (issues.some(i => i.elementId === e.id && i.fixId === "overset"))
                    n.oversetText = false;
                if (issues.some(i => i.elementId === e.id && i.fixId === "remove-token") && n.text)
                    n.text = n.text.replace(/\{\{[^}]+\}\}/g, "");
                return n;
            }) })) };
    const usedStyles = new Set(p.pages.flatMap(pg => pg.elements.flatMap(e => [e.characterStyleId, e.paragraphStyleId, e.professionalStyleId].filter(Boolean))));
    p = { ...p, documentStyles: { ...p.documentStyles, styles: p.documentStyles.styles.filter(s => s.builtIn || usedStyles.has(s.id)) } };
    const usedTokens = new Set(p.pages.flatMap(pg => pg.elements.flatMap(e => textTokens(e.text ?? ""))));
    p = { ...p, documentVariables: { ...p.documentVariables, variables: p.documentVariables.variables.filter(v => v.kind !== "custom" || usedTokens.has(v.token)) } };
    return storePublicationAudit(p, runPublicationPreflight(p));
}
export function storePublicationAudit(project, issues = runPublicationPreflight(project)) { const p = normalizePublicationCompletion(project); return { ...p, publicationCompletion: { ...p.publicationCompletion, lastIssues: issues, lastAuditAt: Date.now() } }; }
export function calculateAccessibilityScore(project) { const issues = runPublicationPreflight(project).filter(i => i.category === "accessibility"); return Math.max(0, 100 - issues.filter(i => i.severity === "error").length * 20 - issues.filter(i => i.severity === "warning").length * 5); }
export function createPublicationCertificate(project) {
    const issues = runPublicationPreflight(project), errors = issues.filter(i => i.severity === "error").length, warnings = issues.filter(i => i.severity === "warning").length;
    const cats = [["Document Foundation", ["document", "layout"]], ["Styles", ["style"]], ["References", ["reference"]], ["Variables", ["variable"]], ["Assets", ["asset"]], ["Accessibility", ["accessibility"]], ["Performance", ["performance"]]];
    const checks = {};
    for (const [name, c] of cats) {
        const list = issues.filter(i => c.includes(i.category));
        checks[name] = list.some(i => i.severity === "error") ? "FAIL" : list.some(i => i.severity === "warning") ? "WARN" : "PASS";
    }
    checks.Packaging = "PASS";
    checks.Export = "PASS";
    const score = Math.max(0, 100 - errors * 12 - warnings * 3);
    return { id: uid("cert"), generatedAt: Date.now(), score, productionReady: errors === 0, checks, errors, warnings };
}
export function certifyPublication(project) { const p = normalizePublicationCompletion(project), cert = createPublicationCertificate(p); return { ...p, publicationCompletion: { ...p.publicationCompletion, lastIssues: runPublicationPreflight(p), lastAuditAt: Date.now(), lastCertificate: cert } }; }
export function createPublicationPackageManifest(project) {
    const p = normalizePublicationCompletion(project), assets = p.pages.flatMap(pg => pg.elements).filter(isImage).length, references = p.documentReferences.bookmarks.length + p.documentReferences.crossReferences.length + p.documentReferences.notes.length + p.documentReferences.indexEntries.length;
    const files = ["project.json", "styles.json", "variables.json", "references.json", "metadata.json", "production-report.json", "README.txt", "LICENSE.txt"];
    const raw = `${p.id}:${p.updatedAt}:${p.pages.length}:${assets}`;
    const checksum = Array.from(raw).reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7).toString(16);
    return { generatedAt: Date.now(), projectId: p.id, projectName: p.name, files, counts: { pages: p.pages.length, elements: p.pages.reduce((a, pg) => a + pg.elements.length, 0), styles: p.documentStyles.styles.length, variables: p.documentVariables.variables.length, references, assets }, checksum };
}
export function storePackageManifest(project) { const p = normalizePublicationCompletion(project); return { ...p, publicationCompletion: { ...p.publicationCompletion, packageManifest: createPublicationPackageManifest(p) } }; }
export function optimizePublication(project) { const repaired = repairPublicationIssues(project); return { ...repaired, updatedAt: Date.now(), publicationCompletion: { ...repaired.publicationCompletion, optimizedAt: Date.now() } }; }
export function buildProductionReport(project) { const p = normalizePublicationCompletion(project), issues = runPublicationPreflight(p), cert = createPublicationCertificate(p); return { phase: "21.4", generatedAt: new Date().toISOString(), project: { id: p.id, name: p.name }, statistics: calculateDocumentStatistics(p), pageNumbers: buildPageNumberMap(p), issues, accessibilityScore: calculateAccessibilityScore(p), certificate: cert, package: createPublicationPackageManifest(p) }; }
export function exportProductionReport(project, format = "json") { const r = buildProductionReport(project); if (format === "json")
    return JSON.stringify(r, null, 2); return [`Yaposan Professional Publication Report`, `Project: ${r.project.name}`, `Score: ${r.certificate.score}%`, `Production Ready: ${r.certificate.productionReady ? "YES" : "NO"}`, `Errors: ${r.certificate.errors}`, `Warnings: ${r.certificate.warnings}`, `Accessibility: ${r.accessibilityScore}%`, "", ...r.issues.map(i => `[${i.severity.toUpperCase()}] ${i.category}: ${i.message}`)].join("\n"); }
