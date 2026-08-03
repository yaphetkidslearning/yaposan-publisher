import { getLayoutSettings } from "./layoutGuideEngine";
import { DEFAULT_LAYERS } from "./spreadLayerEngine";
const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const DEFAULT_INTERACTION_SETTINGS = { magnetStrength: 1, snapPriority: ["guides", "objects", "margins", "grid", "page"], showSnapLabels: true, showDistances: true, showEqualSpacing: true, altDisablesSnap: true, pasteboardSize: 500, pasteboardSnap: true };
export function getPhase124Data(project) { const current = project.phase124Data; return { guidePresets: current?.guidePresets ?? [], gridPresets: current?.gridPresets ?? [], masterEditingId: current?.masterEditingId, interaction: { ...DEFAULT_INTERACTION_SETTINGS, ...(current?.interaction ?? {}) } }; }
export function saveGuidePreset(project, page, name) { const d = getPhase124Data(project); const preset = { id: uid("guide-preset"), name: name.trim() || "Guide Preset", guides: getLayoutSettings(page).guides.map(g => ({ ...g, id: uid("guide") })) }; return { ...project, phase124Data: { ...d, guidePresets: [...d.guidePresets, preset] } }; }
export function applyGuidePreset(page, preset) { const s = getLayoutSettings(page); return { ...page, layoutSettings: { ...s, guides: preset.guides.map(g => ({ ...g, id: uid("guide") })) } }; }
export function saveGridPreset(project, page, name) { const d = getPhase124Data(project), s = getLayoutSettings(page); const settings = { gridType: s.gridType, gridSpacing: s.gridSpacing, gridSubdivisions: s.gridSubdivisions, columns: s.columns, rows: s.rows, gutter: s.gutter, gridColor: s.gridColor, gridOpacity: s.gridOpacity }; return { ...project, phase124Data: { ...d, gridPresets: [...d.gridPresets, { id: uid("grid-preset"), name: name.trim() || "Grid Preset", settings }] } }; }
export function applyGridPreset(page, preset) { const s = getLayoutSettings(page); return { ...page, layoutSettings: { ...s, ...preset.settings, gridVisible: true } }; }
export function duplicateGuide(page, id, offset = 12) { const s = getLayoutSettings(page), g = s.guides.find(x => x.id === id); if (!g)
    return page; return { ...page, layoutSettings: { ...s, guides: [...s.guides, { ...g, id: uid("guide"), name: `${g.name} Copy`, position: g.position + offset, locked: false }] } }; }
export function moveGuide(page, id, position) { const s = getLayoutSettings(page); return { ...page, layoutSettings: { ...s, guides: s.guides.map(g => g.id === id && !g.locked ? { ...g, position: Math.max(0, position) } : g) } }; }
export function computeSpacingFeedback(elements, movingId, x, y) { const moving = elements.find(e => e.id === movingId); if (!moving)
    return null; const others = elements.filter(e => e.id !== movingId && !e.hidden); let nearestX, nearestY, dx = Infinity, dy = Infinity; for (const e of others) {
    for (const t of [e.x, e.x + e.width / 2, e.x + e.width]) {
        const d = Math.abs((x + moving.width / 2) - t);
        if (d < dx) {
            dx = d;
            nearestX = t;
        }
    }
    for (const t of [e.y, e.y + e.height / 2, e.y + e.height]) {
        const d = Math.abs((y + moving.height / 2) - t);
        if (d < dy) {
            dy = d;
            nearestY = t;
        }
    }
} return { vertical: dx <= 8 ? nearestX : undefined, horizontal: dy <= 8 ? nearestY : undefined, distanceX: Number.isFinite(dx) ? Math.round(dx) : undefined, distanceY: Number.isFinite(dy) ? Math.round(dy) : undefined }; }
export function updateAnchoredElements(page) { return { ...page, elements: page.elements.map(e => { if (!e.anchorMode || e.anchorMode === "none")
        return e; const target = e.anchorMode === "page" ? { x: 0, y: 0 } : e.anchorMode === "margins" ? { x: page.margin, y: page.margin } : page.elements.find(x => x.id === e.anchorTargetId && x.isFrame); if (!target)
        return e; return { ...e, x: e.anchorLockX ? e.x : target.x + (e.anchorOffsetX ?? 0), y: e.anchorLockY ? e.y : target.y + (e.anchorOffsetY ?? 0) }; }) }; }
export function updateAdvancedLayer(project, layerId, updates) { return { ...project, layers: (project.layers ?? DEFAULT_LAYERS).map(l => l.id === layerId ? { ...l, ...updates } : l) }; }
export function createLayerFolder(project, name = "Layer Folder") { const layers = project.layers ?? DEFAULT_LAYERS; const folder = { id: uid("layer-folder"), name, visible: true, locked: false, printable: true, color: "#64748B", order: layers.length, isFolder: true, opacity: 1, blendMode: "normal" }; return { ...project, layers: [...layers, folder] }; }
export function setMasterEditing(project, masterId) { return { ...project, phase124Data: { ...getPhase124Data(project), masterEditingId: masterId } }; }
export function overrideMasterObject(page, elementId) { return { ...page, elements: page.elements.map(e => e.id === elementId && e.masterSpreadId ? { ...e, masterLocked: false, masterOverride: true } : e) }; }
export function resetMasterOverrides(page) { return { ...page, elements: page.elements.filter(e => !e.masterOverride) }; }
export function phase124Diagnostics(project) { const d = getPhase124Data(project); const all = project.pages.flatMap(p => p.elements); return { guidePresets: d.guidePresets.length, gridPresets: d.gridPresets.length, layerFolders: (project.layers ?? []).filter(l => l.isFolder).length, masterOverrides: all.filter(e => e.masterOverride).length, brokenAnchors: all.filter(e => e.anchorMode === "frame" && !all.some(t => t.id === e.anchorTargetId && t.isFrame)).length, invalidFrames: all.filter(e => e.isFrame && (e.width <= 0 || e.height <= 0)).length }; }
