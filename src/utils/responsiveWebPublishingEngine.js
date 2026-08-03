import { normalizeDigitalPublishingFoundation } from "./digitalPublishingFoundationEngine";
const BREAKPOINTS = [
    { id: "mobile", width: 390, columns: 4, gutter: 16, margin: 16 },
    { id: "tablet", width: 834, columns: 8, gutter: 20, margin: 24 },
    { id: "desktop", width: 1440, columns: 12, gutter: 24, margin: 32 },
];
function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `rw-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function createOverride(element, breakpointId) {
    return {
        elementId: element.id,
        breakpointId,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        visibility: element.hidden === true ? "hidden" : "visible",
        positionMode: "absolute",
    };
}
export function createDefaultResponsiveWebPublishingState(project, now = Date.now()) {
    const layouts = project.pages.flatMap((page) => BREAKPOINTS.map((breakpoint) => ({
        pageId: page.id,
        breakpointId: breakpoint.id,
        canvasWidth: breakpoint.width,
        minHeight: Math.max(480, Math.round((page.height / Math.max(page.width, 1)) * breakpoint.width)),
        columns: breakpoint.columns,
        gutter: breakpoint.gutter,
        margin: breakpoint.margin,
        overrides: page.elements.map((element) => createOverride(element, breakpoint.id)),
        updatedAt: now,
    })));
    return {
        version: "22.1",
        initializedAt: now,
        updatedAt: now,
        activeBreakpointId: "desktop",
        autoFitText: true,
        preserveAspectRatio: true,
        layouts,
        revision: 1,
    };
}
export function normalizeResponsiveWebPublishing(project) {
    const foundation = normalizeDigitalPublishingFoundation(project);
    const now = Date.now();
    const fallback = createDefaultResponsiveWebPublishingState(foundation, now);
    const current = foundation.responsiveWebPublishing;
    const validPageIds = new Set(foundation.pages.map((page) => page.id));
    const expectedKeys = new Set(fallback.layouts.map((layout) => `${layout.pageId}:${layout.breakpointId}`));
    const currentByKey = new Map((current?.layouts ?? []).map((layout) => [`${layout.pageId}:${layout.breakpointId}`, layout]));
    const layouts = fallback.layouts.map((defaultLayout) => {
        const existing = currentByKey.get(`${defaultLayout.pageId}:${defaultLayout.breakpointId}`);
        if (!existing || !validPageIds.has(existing.pageId))
            return defaultLayout;
        return {
            ...defaultLayout,
            ...existing,
            canvasWidth: Math.max(320, existing.canvasWidth || defaultLayout.canvasWidth),
            minHeight: Math.max(320, existing.minHeight || defaultLayout.minHeight),
            columns: Math.max(1, existing.columns || defaultLayout.columns),
            gutter: Math.max(0, existing.gutter ?? defaultLayout.gutter),
            margin: Math.max(0, existing.margin ?? defaultLayout.margin),
            overrides: (existing.overrides ?? []).filter((override) => override.breakpointId === existing.breakpointId),
            updatedAt: existing.updatedAt || now,
        };
    });
    for (const layout of current?.layouts ?? []) {
        const key = `${layout.pageId}:${layout.breakpointId}`;
        if (validPageIds.has(layout.pageId) && !expectedKeys.has(key))
            layouts.push(layout);
    }
    return {
        ...foundation,
        phase22Version: "22.1",
        responsiveWebPublishing: {
            ...fallback,
            ...current,
            version: "22.1",
            updatedAt: now,
            activeBreakpointId: current?.activeBreakpointId ?? "desktop",
            autoFitText: current?.autoFitText !== false,
            preserveAspectRatio: current?.preserveAspectRatio !== false,
            layouts,
            revision: Math.max(1, current?.revision ?? 1),
        },
    };
}
export function updateResponsiveElementOverride(project, pageId, breakpointId, elementId, updates) {
    const normalized = normalizeResponsiveWebPublishing(project);
    const state = normalized.responsiveWebPublishing;
    const now = Date.now();
    const layouts = state.layouts.map((layout) => {
        if (layout.pageId !== pageId || layout.breakpointId !== breakpointId)
            return layout;
        const existing = layout.overrides.find((override) => override.elementId === elementId);
        const next = {
            elementId,
            breakpointId,
            visibility: "visible",
            positionMode: "absolute",
            ...existing,
            ...updates,
        };
        return {
            ...layout,
            updatedAt: now,
            overrides: existing
                ? layout.overrides.map((override) => override.elementId === elementId ? next : override)
                : [...layout.overrides, next],
        };
    });
    return {
        ...normalized,
        updatedAt: now,
        responsiveWebPublishing: { ...state, updatedAt: now, layouts, revision: state.revision + 1 },
    };
}
export function validateResponsiveWebPublishing(project) {
    const normalized = normalizeResponsiveWebPublishing(project);
    const state = normalized.responsiveWebPublishing;
    const issues = [];
    const pageById = new Map(normalized.pages.map((page) => [page.id, page]));
    for (const layout of state.layouts) {
        const page = pageById.get(layout.pageId);
        if (!page) {
            issues.push({ id: `missing-page-${layout.pageId}`, severity: "error", pageId: layout.pageId, breakpointId: layout.breakpointId, message: "Responsive layout references a missing page.", fix: "Remove the orphaned layout." });
            continue;
        }
        if (layout.canvasWidth < 320)
            issues.push({ id: `width-${layout.pageId}-${layout.breakpointId}`, severity: "error", pageId: layout.pageId, breakpointId: layout.breakpointId, message: "Responsive canvas width is below 320 pixels.", fix: "Use a canvas width of at least 320 pixels." });
        if (layout.columns < 1)
            issues.push({ id: `columns-${layout.pageId}-${layout.breakpointId}`, severity: "error", pageId: layout.pageId, breakpointId: layout.breakpointId, message: "Responsive grid must have at least one column.", fix: "Set one or more columns." });
        const elementIds = new Set(page.elements.map((element) => element.id));
        const seen = new Set();
        for (const override of layout.overrides) {
            if (!elementIds.has(override.elementId))
                issues.push({ id: `orphan-${override.elementId}-${layout.breakpointId}`, severity: "warning", pageId: page.id, elementId: override.elementId, breakpointId: layout.breakpointId, message: "Responsive override references a missing element.", fix: "Remove the orphaned override." });
            if (seen.has(override.elementId))
                issues.push({ id: `duplicate-${override.elementId}-${layout.breakpointId}`, severity: "error", pageId: page.id, elementId: override.elementId, breakpointId: layout.breakpointId, message: "Element has duplicate overrides for the same breakpoint.", fix: "Keep one override per element and breakpoint." });
            seen.add(override.elementId);
            if ((override.width ?? 1) <= 0 || (override.height ?? 1) <= 0)
                issues.push({ id: `size-${override.elementId}-${layout.breakpointId}`, severity: "error", pageId: page.id, elementId: override.elementId, breakpointId: layout.breakpointId, message: "Responsive element size must be positive.", fix: "Set positive width and height values." });
        }
    }
    return issues;
}
export function createResponsivePreviewManifest(project) {
    const normalized = normalizeResponsiveWebPublishing(project);
    const state = normalized.responsiveWebPublishing;
    const foundation = normalized.digitalPublishingFoundation;
    const pages = normalized.pages.map((page) => ({
        id: page.id,
        name: page.name,
        layouts: state.layouts.filter((layout) => layout.pageId === page.id).map((layout) => ({
            breakpointId: layout.breakpointId,
            canvasWidth: layout.canvasWidth,
            minHeight: layout.minHeight,
            columns: layout.columns,
            elementCount: layout.overrides.length,
            hiddenElementCount: layout.overrides.filter((override) => override.visibility === "hidden").length,
        })),
    }));
    const payload = { projectId: normalized.id, publicationId: foundation.publicationId, revision: state.revision, pages };
    return {
        version: "22.1",
        generatedAt: Date.now(),
        projectId: normalized.id,
        projectName: normalized.name,
        publicationId: foundation.publicationId,
        revision: state.revision,
        pages,
        checksum: stableHash(JSON.stringify(payload)),
    };
}
export function exportResponsiveWebPublishing(project) {
    const normalized = normalizeResponsiveWebPublishing(project);
    return JSON.stringify({
        phase: "22.1",
        project: { id: normalized.id, name: normalized.name },
        state: normalized.responsiveWebPublishing,
        validation: validateResponsiveWebPublishing(normalized),
        previewManifest: createResponsivePreviewManifest(normalized),
    }, null, 2);
}
