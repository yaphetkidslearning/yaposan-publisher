import { runAiWriting } from "./aiService";
export const PROFILE_GUIDANCE = {
    Church: "Warm, welcoming, respectful, faith-centered, and community-oriented.", Business: "Professional, concise, credible, and action-oriented.", Nonprofit: "Mission-driven, inclusive, hopeful, and donor-friendly.", School: "Clear, encouraging, age-appropriate, and family-friendly.", Restaurant: "Appetizing, vivid, concise, and promotion-ready.", Medical: "Clear, careful, accessible, and non-diagnostic.", Retail: "Benefit-led, persuasive, concise, and conversion-focused.", Custom: "Follow the project's custom profile instructions."
};
export function getCompletionData(project) { return project.aiCompletionData ?? { profile: "Business", revisions: [] }; }
export function describeObjects(elements, scope) {
    const textCount = elements.filter(e => e.type === "text").length, imageCount = elements.filter(e => e.type === "image").length, shapeCount = elements.filter(e => ["rectangle", "circle", "line", "triangle", "arrow", "star", "svg"].includes(e.type)).length;
    const tableCount = elements.filter(e => e.type === "table").length;
    return { scope, objectCount: elements.length, textCount, imageCount, shapeCount, tableCount, summary: `${scope}: ${elements.length} objects · ${textCount} text · ${imageCount} images · ${shapeCount} shapes · ${tableCount} tables` };
}
export function resolvePromptVariables(template, project, pageNumber = 1) {
    const vars = project.mergeData?.variables ?? {};
    const map = { ProjectName: project.name, BusinessName: vars.businessname ?? vars.businessName ?? "", Address: vars.address ?? "", Phone: vars.phone ?? "", Website: vars.website ?? "", Email: vars.email ?? "", CurrentPage: String(pageNumber), TotalPages: String(project.pages.length), Author: project.author ?? "", TodaysDate: new Date().toLocaleDateString(), "Today'sDate": new Date().toLocaleDateString() };
    return template.replace(/{{\s*([^{}]+?)\s*}}/g, (_, key) => map[key] ?? vars[key] ?? vars[key.toLowerCase()] ?? `{{${key}}}`);
}
export function confidenceScore(original, result) {
    const clean = (v) => v.trim();
    if (!clean(result))
        return 0;
    let score = 72;
    const lengthRatio = clean(original) ? clean(result).length / clean(original).length : 1;
    if (lengthRatio > .45 && lengthRatio < 2.3)
        score += 10;
    if (/[.!?]$/.test(clean(result)))
        score += 5;
    if (!/\s{2,}/.test(result))
        score += 5;
    if (result.split(/\s+/).length >= 4)
        score += 5;
    return Math.min(99, score);
}
export async function processTextElements(project, elementIds, action, prompt, targetLanguage) {
    const revisions = [];
    const pages = [];
    for (const page of project.pages) {
        const elements = [];
        for (const element of page.elements) {
            if (element.type !== "text" || !elementIds.includes(element.id) || !element.text) {
                elements.push(element);
                continue;
            }
            const profile = getCompletionData(project).profile;
            const resolved = resolvePromptVariables(`${prompt}\nProfile: ${PROFILE_GUIDANCE[profile]}`, project, project.pages.indexOf(page) + 1);
            const result = await runAiWriting({ action, text: element.text, prompt: resolved, targetLanguage });
            revisions.push({ id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, elementId: element.id, pageId: page.id, action, original: element.text, result, createdAt: Date.now(), confidence: confidenceScore(element.text, result) });
            elements.push({ ...element, text: result });
        }
        pages.push({ ...page, elements });
    }
    const previous = getCompletionData(project);
    return { project: { ...project, pages, updatedAt: Date.now(), aiCompletionData: { ...previous, revisions: [...revisions, ...previous.revisions].slice(0, 300) } }, revisions };
}
export function restoreRevision(project, revision, useResult = false) { return { ...project, pages: project.pages.map(p => p.id !== revision.pageId ? p : { ...p, elements: p.elements.map(e => e.id === revision.elementId ? { ...e, text: useResult ? revision.result : revision.original } : e) }), updatedAt: Date.now() }; }
