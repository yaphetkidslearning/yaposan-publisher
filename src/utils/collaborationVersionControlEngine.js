const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const stable = (value) => { if (Array.isArray(value))
    return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object")
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`; return JSON.stringify(value); };
export function hashProject(project) { let h = 2166136261; const source = stable({ ...project, updatedAt: 0, collaborationWorkspace: undefined }); for (let i = 0; i < source.length; i++) {
    h ^= source.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return (h >>> 0).toString(16).padStart(8, "0"); }
export function getPhase23State(project) { const stored = project.collaborationWorkspace; return { version: "23.0", versions: stored?.versions ?? [], importedChangeSets: stored?.importedChangeSets ?? [], lastCertification: stored?.lastCertification }; }
export function withPhase23State(project, state) { return { ...project, collaborationWorkspace: state, phase23Version: "23.0", updatedAt: Date.now() }; }
const cleanProject = (project) => JSON.parse(JSON.stringify({ ...project, collaborationWorkspace: undefined }));
const byId = (items) => new Map(items.map(x => [x.id, x]));
function diffElements(pageId, before, after) { const a = byId(before), b = byId(after), out = []; for (const [id, item] of b) {
    const old = a.get(id);
    if (!old)
        out.push({ id: uid("change"), kind: "element-added", pageId, elementId: id, summary: `Added ${item.type} object`, after: item });
    else if (stable(old) !== stable(item))
        out.push({ id: uid("change"), kind: "element-updated", pageId, elementId: id, summary: `Updated ${item.type} object`, before: old, after: item });
} for (const [id, item] of a)
    if (!b.has(id))
        out.push({ id: uid("change"), kind: "element-removed", pageId, elementId: id, summary: `Removed ${item.type} object`, before: item }); return out; }
export function diffProjects(before, after) { const a = byId(before.pages), b = byId(after.pages), out = []; for (const [id, page] of b) {
    const old = a.get(id);
    if (!old)
        out.push({ id: uid("change"), kind: "page-added", pageId: id, summary: `Added page ${page.name}`, after: page });
    else {
        const oldMeta = { ...old, elements: undefined }, newMeta = { ...page, elements: undefined };
        if (stable(oldMeta) !== stable(newMeta))
            out.push({ id: uid("change"), kind: "page-updated", pageId: id, summary: `Updated page ${page.name}`, before: oldMeta, after: newMeta });
        out.push(...diffElements(id, old.elements, page.elements));
    }
} for (const [id, page] of a)
    if (!b.has(id))
        out.push({ id: uid("change"), kind: "page-removed", pageId: id, summary: `Removed page ${page.name}`, before: page }); return out; }
export function createProjectVersion(project, label, author = "Project Owner", note) { const state = getPhase23State(project); const previous = state.versions[0]?.project; const snapshot = cleanProject(project); const version = { id: uid("version"), label: label.trim() || `Version ${state.versions.length + 1}`, author: author.trim() || "Project Owner", note: note?.trim(), createdAt: Date.now(), projectHash: hashProject(snapshot), project: snapshot, changeCount: previous ? diffProjects(previous, snapshot).length : 0 }; return { ...state, versions: [version, ...state.versions].slice(0, 100) }; }
export function restoreProjectVersion(current, version) { const state = getPhase23State(current); return withPhase23State({ ...cleanProject(version.project), id: current.id, name: current.name, updatedAt: Date.now() }, state); }
export function createChangeSet(project, baseVersionId, author = "Project Owner", note) { const state = getPhase23State(project); const base = state.versions.find(v => v.id === baseVersionId); if (!base)
    throw new Error("Base version was not found."); return { schema: "yaposan.phase23.changeset", version: 1, id: uid("changeset"), projectId: project.id, projectName: project.name, baseHash: base.projectHash, createdAt: Date.now(), author: author.trim() || "Project Owner", note: note?.trim(), changes: diffProjects(base.project, project), sourceProject: cleanProject(project) }; }
export function serializeChangeSet(set) { return JSON.stringify(set, null, 2); }
export function parseChangeSet(source) { const value = JSON.parse(source); if (value.schema !== "yaposan.phase23.changeset" || value.version !== 1 || !Array.isArray(value.changes))
    throw new Error("Unsupported Phase 23 change set."); return value; }
function fields(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
export function detectMergeConflicts(base, local, incoming) { const conflicts = []; const basePages = byId(base.pages), localPages = byId(local.pages), incomingPages = byId(incoming.pages); for (const [pageId, inPage] of incomingPages) {
    const bPage = basePages.get(pageId), lPage = localPages.get(pageId);
    if (!bPage || !lPage)
        continue;
    const bEls = byId(bPage.elements), lEls = byId(lPage.elements), iEls = byId(inPage.elements);
    for (const [elementId, iEl] of iEls) {
        const bEl = bEls.get(elementId), lEl = lEls.get(elementId);
        if (!bEl || !lEl)
            continue;
        const keys = new Set([...Object.keys(fields(bEl)), ...Object.keys(fields(lEl)), ...Object.keys(fields(iEl))]);
        for (const field of keys) {
            const bv = fields(bEl)[field], lv = fields(lEl)[field], iv = fields(iEl)[field];
            if (stable(lv) !== stable(bv) && stable(iv) !== stable(bv) && stable(lv) !== stable(iv))
                conflicts.push({ id: uid("conflict"), pageId, elementId, field, baseValue: bv, localValue: lv, incomingValue: iv });
        }
    }
} return conflicts; }
export function applyChangeSet(project, set, strategy = "incoming") { const state = getPhase23State(project); const base = state.versions.find(v => v.projectHash === set.baseHash); if (!base)
    throw new Error("The change set base version is not available in this project."); const conflicts = detectMergeConflicts(base.project, project, set.sourceProject); if (conflicts.length && strategy === "local")
    return { project, conflicts }; const conflictKeys = new Set(conflicts.map(c => `${c.pageId}:${c.elementId ?? ""}:${c.field}`)); const localPages = byId(project.pages); const incomingPages = byId(set.sourceProject.pages); const mergedPages = []; for (const inPage of set.sourceProject.pages) {
    const local = localPages.get(inPage.id);
    if (!local) {
        mergedPages.push(inPage);
        continue;
    }
    const localElements = byId(local.elements);
    const elements = inPage.elements.map(inEl => { const localEl = localElements.get(inEl.id); if (!localEl)
        return inEl; if (strategy === "incoming")
        return inEl; const merged = { ...inEl }; for (const key of Object.keys(merged))
        if (conflictKeys.has(`${inPage.id}:${inEl.id}:${key}`))
            merged[key] = localEl[key]; return merged; });
    mergedPages.push({ ...inPage, elements });
} for (const local of project.pages)
    if (!incomingPages.has(local.id))
        mergedPages.push(local); const next = withPhase23State({ ...project, pages: mergedPages, activePageId: mergedPages.some(p => p.id === project.activePageId) ? project.activePageId : mergedPages[0]?.id ?? project.activePageId, updatedAt: Date.now() }, { ...state, importedChangeSets: [set, ...state.importedChangeSets.filter(x => x.id !== set.id)].slice(0, 50) }); return { project: next, conflicts }; }
export function certifyPhase23(project) { const state = getPhase23State(project), issues = []; if (!project.pages.length)
    issues.push("Project contains no pages."); if (!state.versions.length)
    issues.push("No immutable project version has been created."); const ids = new Set(); for (const page of project.pages) {
    if (ids.has(page.id))
        issues.push(`Duplicate page id: ${page.id}`);
    ids.add(page.id);
    for (const el of page.elements) {
        if (ids.has(el.id))
            issues.push(`Duplicate element id: ${el.id}`);
        ids.add(el.id);
    }
} if (state.versions[0] && state.versions[0].projectHash !== hashProject(state.versions[0].project))
    issues.push("Latest version integrity hash is invalid."); const score = Math.max(0, 100 - issues.length * 20); return { generatedAt: Date.now(), score, passed: issues.length === 0, issues, versionCount: state.versions.length, currentHash: hashProject(project) }; }
export function storePhase23Certification(project) { const state = getPhase23State(project); return withPhase23State(project, { ...state, lastCertification: certifyPhase23(project) }); }
export function exportPhase23Report(project) { const state = getPhase23State(project); return JSON.stringify({ schema: "yaposan.phase23.certification", version: 1, project: { id: project.id, name: project.name, hash: hashProject(project) }, generatedAt: Date.now(), versions: state.versions.map(({ project: _, ...v }) => v), importedChangeSets: state.importedChangeSets.map(({ sourceProject: _, ...s }) => s), certification: certifyPhase23(project) }, null, 2); }
