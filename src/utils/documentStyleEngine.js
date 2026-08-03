const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => Date.now();
export function createDocumentStyleState() {
    const t = now();
    const styles = [
        { id: "style-body", name: "Body", kind: "paragraph", description: "Professional body copy", updates: { fontFamily: "Arial", fontSize: 11, lineHeight: 1.45, textColor: "#111827" }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
        { id: "style-heading-1", name: "Heading 1", kind: "paragraph", description: "Primary section heading", updates: { fontFamily: "Arial", fontSize: 28, fontWeight: "700", lineHeight: 1.15, textColor: "#111827" }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
        { id: "style-heading-2", name: "Heading 2", kind: "paragraph", basedOnId: "style-heading-1", description: "Secondary heading", updates: { fontSize: 20 }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
        { id: "style-emphasis", name: "Emphasis", kind: "character", updates: { italic: true, fontWeight: "600" }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
        { id: "style-image-frame", name: "Image Frame", kind: "object", updates: { borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 8 }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
        { id: "style-table-clean", name: "Clean Table", kind: "table", updates: { borderColor: "#94a3b8", borderWidth: 1 }, locked: false, builtIn: true, createdAt: t, updatedAt: t },
    ];
    return { version: "21.1", styles, defaultStyleIds: { paragraph: "style-body", object: "style-image-frame", table: "style-table-clean" }, updatedAt: t };
}
export function normalizeDocumentStyles(project) {
    const current = project.documentStyles ?? createDocumentStyleState();
    const ids = new Set();
    const styles = current.styles.filter(s => s?.id && s?.name && !ids.has(s.id) && (ids.add(s.id), true)).map(s => ({ ...s, locked: Boolean(s.locked), builtIn: Boolean(s.builtIn), updates: s.updates ?? {}, updatedAt: s.updatedAt || now(), createdAt: s.createdAt || now() }));
    return { ...project, phase21Version: "21.1", documentStyles: { ...current, version: "21.1", styles, updatedAt: now() } };
}
export function resolveDocumentStyle(state, styleId, seen = new Set()) {
    if (seen.has(styleId))
        throw new Error("Circular style inheritance detected.");
    seen.add(styleId);
    const style = state.styles.find(s => s.id === styleId);
    if (!style)
        throw new Error("Style not found.");
    return { ...(style.basedOnId ? resolveDocumentStyle(state, style.basedOnId, seen) : {}), ...style.updates };
}
export function addDocumentStyle(project, input) {
    const p = normalizeDocumentStyles(project), state = p.documentStyles, t = now();
    const style = { id: uid("style"), name: input.name.trim() || `New ${input.kind} style`, kind: input.kind, basedOnId: input.basedOnId, description: input.description, updates: input.updates ?? {}, locked: false, builtIn: false, createdAt: t, updatedAt: t };
    const next = { ...state, styles: [...state.styles, style], updatedAt: t };
    resolveDocumentStyle(next, style.id);
    return { ...p, updatedAt: t, documentStyles: next };
}
export function updateDocumentStyle(project, styleId, updates) {
    const p = normalizeDocumentStyles(project), state = p.documentStyles, existing = state.styles.find(s => s.id === styleId);
    if (!existing)
        return p;
    if (existing.locked)
        throw new Error("Unlock the style before editing it.");
    const next = { ...state, styles: state.styles.map(s => s.id === styleId ? { ...s, ...updates, id: s.id, createdAt: s.createdAt, updatedAt: now() } : s), updatedAt: now() };
    const resolved = resolveDocumentStyle(next, styleId);
    const pages = p.pages.map(page => ({ ...page, elements: page.elements.map(element => element.documentStyleId === styleId ? { ...element, ...resolved, id: element.id, documentStyleId: styleId } : element) }));
    return { ...p, pages, updatedAt: now(), documentStyles: next };
}
export function duplicateDocumentStyle(project, styleId) {
    const p = normalizeDocumentStyles(project), s = p.documentStyles.styles.find(x => x.id === styleId);
    if (!s)
        return p;
    return addDocumentStyle(p, { name: `${s.name} Copy`, kind: s.kind, basedOnId: s.basedOnId, updates: { ...s.updates }, description: s.description });
}
export function deleteDocumentStyle(project, styleId, replacementId) {
    const p = normalizeDocumentStyles(project), state = p.documentStyles, s = state.styles.find(x => x.id === styleId);
    if (!s)
        return p;
    if (s.locked || s.builtIn)
        throw new Error("Built-in or locked styles cannot be deleted.");
    const replacement = replacementId && state.styles.some(x => x.id === replacementId) ? replacementId : undefined;
    const pages = p.pages.map(page => ({ ...page, elements: page.elements.map(e => e.documentStyleId === styleId ? { ...e, documentStyleId: replacement } : e) }));
    return { ...p, pages, updatedAt: now(), documentStyles: { ...state, styles: state.styles.filter(x => x.id !== styleId).map(x => x.basedOnId === styleId ? { ...x, basedOnId: undefined } : x), updatedAt: now() } };
}
export function applyDocumentStyle(project, styleId, elementIds) {
    const p = normalizeDocumentStyles(project), updates = resolveDocumentStyle(p.documentStyles, styleId), ids = new Set(elementIds);
    return { ...p, updatedAt: now(), pages: p.pages.map(page => ({ ...page, elements: page.elements.map(e => ids.has(e.id) ? { ...e, ...updates, id: e.id, documentStyleId: styleId } : e) })) };
}
export function clearDocumentStyle(project, elementIds) { const ids = new Set(elementIds); return { ...project, updatedAt: now(), pages: project.pages.map(p => ({ ...p, elements: p.elements.map(e => ids.has(e.id) ? { ...e, documentStyleId: undefined } : e) })) }; }
export function collectStyleUsage(project) { const p = normalizeDocumentStyles(project); return p.documentStyles.styles.map(style => { const pageIds = []; const elementIds = []; p.pages.forEach(page => page.elements.forEach(e => { if (e.documentStyleId === style.id) {
    elementIds.push(e.id);
    if (!pageIds.includes(page.id))
        pageIds.push(page.id);
} })); return { styleId: style.id, count: elementIds.length, pageIds, elementIds }; }); }
export function exportDocumentStyles(project) { const p = normalizeDocumentStyles(project); return JSON.stringify({ phase: "21.1", exportedAt: new Date().toISOString(), projectId: p.id, styles: p.documentStyles }, null, 2); }
