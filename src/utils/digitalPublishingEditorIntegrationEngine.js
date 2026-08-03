import { normalizeDigitalPublishingDeployment, validateDigitalPublishingDeployment } from "./digitalPublishingDeploymentEngine";
const VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 834, height: 1112 },
    mobile: { width: 390, height: 844 },
};
function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        h ^= value.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return `dei-${(h >>> 0).toString(16).padStart(8, "0")}`;
}
function routeFor(page, index) {
    const slug = page.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return index === 0 ? "/" : `/${slug || `page-${index + 1}`}`;
}
export function createDigitalPublishingEditorState(project, now = Date.now()) {
    return {
        version: "22.5", initializedAt: now, updatedAt: now, revision: 1,
        deviceMode: "desktop", activePanel: "overview", previewMode: "design",
        livePreviewEnabled: true, breakpointOverlay: true, responsiveRulers: true,
        responsiveGuides: true, previewPageId: project.activePageId || project.pages[0]?.id || "",
        inspectorEnabled: false,
    };
}
export function normalizeDigitalPublishingEditorIntegration(project) {
    const base = normalizeDigitalPublishingDeployment(project);
    const now = Date.now();
    const fallback = createDigitalPublishingEditorState(base, now);
    const current = base.digitalPublishingEditor;
    const pageIds = new Set(base.pages.map((page) => page.id));
    return {
        ...base,
        phase22Version: "22.5",
        digitalPublishingEditor: {
            ...fallback,
            ...current,
            version: "22.5",
            updatedAt: now,
            revision: Math.max(1, current?.revision ?? 1),
            previewPageId: pageIds.has(current?.previewPageId ?? "") ? current.previewPageId : fallback.previewPageId,
        },
    };
}
export function updateDigitalPublishingEditorState(project, updates) {
    const normalized = normalizeDigitalPublishingEditorIntegration(project);
    const now = Date.now();
    return {
        ...normalized,
        updatedAt: now,
        digitalPublishingEditor: {
            ...normalized.digitalPublishingEditor, ...updates,
            version: "22.5", updatedAt: now,
            revision: normalized.digitalPublishingEditor.revision + 1,
        },
    };
}
export function createDigitalEditorRuntimeManifest(project) {
    const normalized = normalizeDigitalPublishingEditorIntegration(project);
    const state = normalized.digitalPublishingEditor;
    const issues = validateDigitalPublishingDeployment(normalized);
    const manifestBase = {
        version: "22.5",
        projectId: normalized.id,
        projectName: normalized.name,
        deviceMode: state.deviceMode,
        previewMode: state.previewMode,
        previewPageId: state.previewPageId,
        viewport: VIEWPORTS[state.deviceMode],
        pages: normalized.pages.map((page, index) => ({ id: page.id, name: page.name, route: routeFor(page, index), width: page.width, height: page.height, elementCount: page.elements.length })),
        capabilities: ["responsive-canvas", "device-switcher", "navigation-builder", "form-builder", "live-preview", "seo-preview", "accessibility-preview", "performance-preview", "deployment-panel"],
        validation: {
            passed: !issues.some((issue) => issue.severity === "error"),
            errors: issues.filter((issue) => issue.severity === "error").length,
            warnings: issues.filter((issue) => issue.severity === "warning").length,
            infos: issues.filter((issue) => issue.severity === "info").length,
        },
    };
    return { ...manifestBase, checksum: hash(JSON.stringify(manifestBase)) };
}
export function exportDigitalEditorRuntimeReport(project) {
    return JSON.stringify(createDigitalEditorRuntimeManifest(project), null, 2);
}
