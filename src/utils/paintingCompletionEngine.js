export const DEFAULT_PAINTING_COMPLETION_SETTINGS = {
    layerName: "Paint Layer",
    layerOpacity: 1,
    layerBlendMode: "normal",
    maskMode: "none",
    symmetryMode: "none",
    radialSegments: 6,
    symmetryAngle: 0,
    perspectiveMode: "none",
    perspectiveSnap: .65,
    patternEnabled: false,
    patternWidth: 512,
    patternHeight: 512,
    seamlessWrap: true,
    strokeEditable: true,
    preserveVectors: true,
    exportPaintMetadata: true,
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export function normalizePaintingCompletionSettings(value) {
    const s = { ...DEFAULT_PAINTING_COMPLETION_SETTINGS, ...value };
    return {
        ...s,
        layerName: String(s.layerName || "Paint Layer").slice(0, 80),
        layerOpacity: clamp(Number(s.layerOpacity), .01, 1),
        radialSegments: Math.round(clamp(Number(s.radialSegments), 2, 32)),
        symmetryAngle: clamp(Number(s.symmetryAngle), -180, 180),
        perspectiveSnap: clamp(Number(s.perspectiveSnap), 0, 1),
        patternWidth: Math.round(clamp(Number(s.patternWidth), 16, 8192)),
        patternHeight: Math.round(clamp(Number(s.patternHeight), 16, 8192)),
    };
}
export function createPaintLayer(settings, index = 0) {
    const s = normalizePaintingCompletionSettings(settings);
    return {
        id: `paint-layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: index ? `${s.layerName} ${index + 1}` : s.layerName,
        opacity: s.layerOpacity,
        blendMode: s.layerBlendMode,
        visible: true,
        locked: false,
        maskMode: s.maskMode,
        clippedToBelow: s.maskMode === "clipping-mask",
        createdAt: new Date().toISOString(),
    };
}
export function applyPaintingCompletion(element, settings) {
    const s = normalizePaintingCompletionSettings(settings);
    const current = element.paintLayers ?? [];
    const layers = current.length ? current : [createPaintLayer(s, 0)];
    return {
        paintLayers: layers,
        activePaintLayerId: layers[0]?.id,
        paintMaskMode: s.maskMode,
        paintSymmetry: { mode: s.symmetryMode, segments: s.radialSegments, angle: s.symmetryAngle, enabled: s.symmetryMode !== "none" },
        paintPerspective: { mode: s.perspectiveMode, snap: s.perspectiveSnap, enabled: s.perspectiveMode !== "none" },
        paintPattern: s.patternEnabled ? { enabled: true, width: s.patternWidth, height: s.patternHeight, seamless: s.seamlessWrap } : undefined,
        paintStrokeEditable: s.strokeEditable,
        paintPreserveVectors: s.preserveVectors,
        paintExportMetadata: s.exportPaintMetadata,
        phase18Version: "18.3",
    };
}
export function addPaintLayer(element, settings) {
    const current = element.paintLayers ?? [];
    const layer = createPaintLayer(settings, current.length);
    return { paintLayers: [layer, ...current], activePaintLayerId: layer.id, phase18Version: "18.3" };
}
export function buildPhase18Manifest(element) {
    const layers = element.paintLayers ?? [];
    return {
        phase: "18.3",
        layerCount: layers.length,
        visibleLayers: layers.filter(layer => layer.visible).length,
        blendModes: Array.from(new Set(layers.map(layer => layer.blendMode))),
        maskMode: element.paintMaskMode ?? "none",
        symmetry: element.paintSymmetry?.mode ?? "none",
        perspective: element.paintPerspective?.mode ?? "none",
        seamlessPattern: Boolean(element.paintPattern?.enabled && element.paintPattern?.seamless),
        editableStrokes: element.paintStrokeEditable !== false,
        retouchOperations: element.retouchOperations?.length ?? 0,
        brushPreset: element.paintSettings?.presetId ?? null,
    };
}
