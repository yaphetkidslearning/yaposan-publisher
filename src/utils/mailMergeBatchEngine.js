import { DEFAULT_EXPORT_OPTIONS, performBatchExport, performExport } from "./exportEngine";
import { queryMergeRecords, resolveBoundElement } from "./mailMergeEngine";
export const DEFAULT_MERGE_BATCH_SETTINGS = {
    mode: "individual", formats: ["pdf"], fileNameTemplate: "{project}-{record}-{format}-{number}",
    includeDuplicates: false, generateReport: true,
};
function safe(value) { return String(value ?? "").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ") || "record"; }
function recordLabel(record, index) {
    const preferred = ["name", "full_name", "company", "email", "id"].map((key) => record.values[key]).find((value) => String(value ?? "").trim());
    return safe(preferred || `Record ${index + 1}`);
}
function resolvedPage(page, source, data, record, index) {
    const context = { source, record, recordIndex: index, fieldProperties: data.fieldProperties };
    return { ...page, id: `${page.id}-merge-${record.id}`, name: `${page.name} · ${recordLabel(record, index)}`, elements: page.elements.map((element) => resolveBoundElement(element, context)).filter((element) => !element.hidden) };
}
function activeBatchSource(data) {
    const source = data.sources.find((item) => item.id === data.activeSourceId) ?? data.sources[0];
    if (!source)
        return undefined;
    return source;
}
export function getBatchRecords(data, includeDuplicates = false) {
    const source = activeBatchSource(data);
    if (!source)
        return [];
    const duplicateIds = new Set(source.duplicateRecordIds);
    return queryMergeRecords(source, data).filter((record) => includeDuplicates || !duplicateIds.has(record.id));
}
export function buildMergedProjects(project, settings) {
    const data = project.mailMergeData;
    if (!data)
        return [];
    const source = activeBatchSource(data);
    if (!source)
        return [];
    const records = getBatchRecords(data, settings.includeDuplicates);
    const projects = records.map((record, index) => {
        const pages = project.pages.map((page) => resolvedPage(page, source, data, record, index));
        return { ...project, id: `${project.id}-merge-${record.id}`, name: `${project.name} - ${recordLabel(record, index)}`, pages, activePageId: pages[0]?.id ?? project.activePageId, updatedAt: Date.now(), mailMergeData: { ...data, previewEnabled: false, activeRecordId: record.id } };
    });
    if (settings.mode === "individual")
        return projects;
    const pages = projects.flatMap((item) => item.pages);
    return pages.length ? [{ ...project, id: `${project.id}-merge-combined-${Date.now()}`, name: `${project.name} - Combined Merge`, pages, activePageId: pages[0].id, updatedAt: Date.now(), mailMergeData: { ...data, previewEnabled: false } }] : [];
}
function exportOptions(project, settings) {
    return { ...DEFAULT_EXPORT_OPTIONS, formats: settings.formats, pageMode: "all", generateReport: settings.generateReport, fileNameTemplate: settings.fileNameTemplate.replace(/\{record\}/g, "{project}"), pdfXReady: false };
}
export async function executeMergeBatch(project, settings, onProgress, isCancelled) {
    const started = Date.now(), data = project.mailMergeData;
    if (!data)
        throw new Error("No mail merge data is configured.");
    const source = activeBatchSource(data);
    if (!source)
        throw new Error("Select a mail merge data source.");
    const projects = buildMergedProjects(project, settings);
    if (!projects.length)
        throw new Error("No records match the current search and filters.");
    let files = [];
    try {
        if (settings.mode === "combined")
            files = (await performExport(projects[0], exportOptions(projects[0], settings), onProgress, isCancelled)).files;
        else
            files = await performBatchExport({ projects, options: exportOptions(project, settings) }, onProgress, isCancelled);
        return { files, projects, history: { id: `merge-batch-${Date.now()}`, createdAt: Date.now(), sourceId: source.id, sourceName: source.name, mode: settings.mode, formats: settings.formats, recordCount: getBatchRecords(data, settings.includeDuplicates).length, pageCount: projects.reduce((sum, item) => sum + item.pages.length, 0), files, status: "completed", durationMs: Date.now() - started } };
    }
    catch (reason) {
        const message = reason instanceof Error ? reason.message : "Batch merge failed.";
        const cancelled = /cancel/i.test(message) || isCancelled();
        throw Object.assign(new Error(message), { history: { id: `merge-batch-${Date.now()}`, createdAt: Date.now(), sourceId: source.id, sourceName: source.name, mode: settings.mode, formats: settings.formats, recordCount: getBatchRecords(data, settings.includeDuplicates).length, pageCount: projects.reduce((sum, item) => sum + item.pages.length, 0), files, status: cancelled ? "cancelled" : "failed", durationMs: Date.now() - started, error: message } });
    }
}
