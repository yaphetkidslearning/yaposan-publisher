export const PAINT_PRESETS = [
    { presetId: "inking-round", name: "Inking Round", tool: "brush", tip: "round", size: 10, opacity: 1, flow: 1, hardness: .95, spacing: .08, smoothing: .58, scatter: 0, angle: 0, roundness: 1, wetMix: 0, texture: "none", blendMode: "normal" },
    { presetId: "soft-paint", name: "Soft Painter", tool: "brush", tip: "round", size: 34, opacity: .72, flow: .42, hardness: .28, spacing: .12, smoothing: .45, scatter: 0, angle: 0, roundness: 1, wetMix: .18, texture: "canvas", blendMode: "normal" },
    { presetId: "watercolor-wash", name: "Watercolor Wash", tool: "brush", tip: "watercolor", size: 58, opacity: .45, flow: .28, hardness: .12, spacing: .16, smoothing: .38, scatter: .06, angle: 0, roundness: .9, wetMix: .78, texture: "paper", blendMode: "multiply" },
    { presetId: "oil-bristle", name: "Oil Bristle", tool: "brush", tip: "oil", size: 42, opacity: .9, flow: .64, hardness: .62, spacing: .1, smoothing: .3, scatter: .04, angle: 18, roundness: .54, wetMix: .62, texture: "canvas", blendMode: "normal" },
    { presetId: "charcoal", name: "Charcoal", tool: "crayon", tip: "charcoal", size: 18, opacity: .8, flow: .72, hardness: .55, spacing: .18, smoothing: .2, scatter: .16, angle: 0, roundness: .7, wetMix: 0, texture: "grain", blendMode: "multiply" },
    { presetId: "chalk", name: "Chalk", tool: "crayon", tip: "chalk", size: 22, opacity: .76, flow: .66, hardness: .48, spacing: .2, smoothing: .18, scatter: .12, angle: 0, roundness: .8, wetMix: 0, texture: "grain", blendMode: "normal" },
    { presetId: "airbrush-soft", name: "Soft Airbrush", tool: "airbrush", tip: "spray", size: 70, opacity: .3, flow: .2, hardness: .05, spacing: .08, smoothing: .5, scatter: .28, angle: 0, roundness: 1, wetMix: 0, texture: "none", blendMode: "normal" },
    { presetId: "calligraphy-flat", name: "Flat Calligraphy", tool: "calligraphy", tip: "calligraphy", size: 15, opacity: 1, flow: 1, hardness: 1, spacing: .06, smoothing: .62, scatter: 0, angle: 38, roundness: .24, wetMix: 0, texture: "none", blendMode: "normal" },
    { presetId: "marker", name: "Designer Marker", tool: "marker", tip: "flat", size: 16, opacity: .86, flow: .9, hardness: .84, spacing: .08, smoothing: .5, scatter: 0, angle: 12, roundness: .52, wetMix: 0, texture: "none", blendMode: "multiply" },
    { presetId: "highlighter", name: "Highlighter", tool: "highlighter", tip: "flat", size: 24, opacity: .34, flow: .8, hardness: .78, spacing: .08, smoothing: .54, scatter: 0, angle: 0, roundness: .35, wetMix: 0, texture: "none", blendMode: "multiply" },
];
export const DEFAULT_PAINTING_SETTINGS = {
    ...PAINT_PRESETS[0], color: "#172033", secondaryColor: "#FFFFFF", pressureSize: true, pressureOpacity: false, velocitySize: .24, velocityOpacity: .08, tiltSize: 0, rotationJitter: 0, sizeJitter: 0, opacityJitter: 0, strokePrediction: .18, dualBrush: false, dualBrushScale: 1,
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export function normalizePaintingSettings(value) {
    return {
        ...DEFAULT_PAINTING_SETTINGS,
        ...value,
        size: clamp(Number(value?.size ?? DEFAULT_PAINTING_SETTINGS.size), 1, 500),
        opacity: clamp(Number(value?.opacity ?? DEFAULT_PAINTING_SETTINGS.opacity), .01, 1),
        flow: clamp(Number(value?.flow ?? DEFAULT_PAINTING_SETTINGS.flow), .01, 1),
        hardness: clamp(Number(value?.hardness ?? DEFAULT_PAINTING_SETTINGS.hardness), 0, 1),
        spacing: clamp(Number(value?.spacing ?? DEFAULT_PAINTING_SETTINGS.spacing), .01, 2),
        smoothing: clamp(Number(value?.smoothing ?? DEFAULT_PAINTING_SETTINGS.smoothing), 0, 1),
        scatter: clamp(Number(value?.scatter ?? DEFAULT_PAINTING_SETTINGS.scatter), 0, 2),
        angle: clamp(Number(value?.angle ?? DEFAULT_PAINTING_SETTINGS.angle), -180, 180),
        roundness: clamp(Number(value?.roundness ?? DEFAULT_PAINTING_SETTINGS.roundness), .05, 1),
        velocitySize: clamp(Number(value?.velocitySize ?? DEFAULT_PAINTING_SETTINGS.velocitySize), 0, 1),
        velocityOpacity: clamp(Number(value?.velocityOpacity ?? DEFAULT_PAINTING_SETTINGS.velocityOpacity), 0, 1),
        tiltSize: clamp(Number(value?.tiltSize ?? DEFAULT_PAINTING_SETTINGS.tiltSize), 0, 1),
        rotationJitter: clamp(Number(value?.rotationJitter ?? DEFAULT_PAINTING_SETTINGS.rotationJitter), 0, 180),
        sizeJitter: clamp(Number(value?.sizeJitter ?? DEFAULT_PAINTING_SETTINGS.sizeJitter), 0, 1),
        opacityJitter: clamp(Number(value?.opacityJitter ?? DEFAULT_PAINTING_SETTINGS.opacityJitter), 0, 1),
        strokePrediction: clamp(Number(value?.strokePrediction ?? DEFAULT_PAINTING_SETTINGS.strokePrediction), 0, 1),
        dualBrushScale: clamp(Number(value?.dualBrushScale ?? DEFAULT_PAINTING_SETTINGS.dualBrushScale), .1, 4),
        wetMix: clamp(Number(value?.wetMix ?? DEFAULT_PAINTING_SETTINGS.wetMix), 0, 1),
    };
}
export function settingsFromPreset(presetId, current = DEFAULT_PAINTING_SETTINGS) {
    const preset = PAINT_PRESETS.find(item => item.presetId === presetId) ?? PAINT_PRESETS[0];
    return normalizePaintingSettings({ ...current, ...preset, presetId: preset.presetId });
}
export function paintingElementPatch(settings) {
    const s = normalizePaintingSettings(settings);
    return {
        borderColor: s.color, fillColor: s.color, borderWidth: s.size, opacity: s.opacity,
        brushKind: s.tip, paintSettings: s, paintBlendMode: s.blendMode, paintTexture: s.texture,
        vectorBrush: { preset: s.tip === "calligraphy" ? "calligraphy" : s.tip === "flat" ? "marker" : s.tip === "round" ? "ink" : "artistic", angle: s.angle, spacing: s.spacing },
        vectorWidthProfile: { profile: s.roundness < .5 ? "taper-both" : "uniform", strength: Math.round((1 - s.roundness) * 100) },
    };
}
export function smoothPaintPoints(points, amount) {
    const strength = clamp(amount, 0, 1);
    if (points.length < 3 || strength <= 0)
        return points.map(p => ({ ...p }));
    return points.map((point, index) => {
        if (index === 0 || index === points.length - 1)
            return { ...point };
        const before = points[index - 1], after = points[index + 1];
        const averageX = (before.x + point.x + after.x) / 3, averageY = (before.y + point.y + after.y) / 3;
        return { ...point, x: point.x + (averageX - point.x) * strength, y: point.y + (averageY - point.y) * strength };
    });
}
export function buildPaintManifest(element) {
    const settings = normalizePaintingSettings(element.paintSettings);
    return { preset: settings.presetId, tip: settings.tip, size: settings.size, opacity: settings.opacity, flow: settings.flow, hardness: settings.hardness, spacing: settings.spacing, smoothing: settings.smoothing, scatter: settings.scatter, wetMix: settings.wetMix, texture: settings.texture, blendMode: settings.blendMode, points: (element.points ?? element.vectorPoints ?? []).length };
}
export function applyBrushDynamics(points, settings) {
    const s = normalizePaintingSettings(settings);
    return points.map((point, index) => {
        const prev = points[Math.max(0, index - 1)];
        const distance = Math.hypot(point.x - prev.x, point.y - prev.y);
        const velocity = clamp(distance / 24, 0, 1);
        const pressure = clamp(point.pressure ?? (s.pressureSize ? .45 + (1 - velocity) * .55 : 1), .05, 1);
        const random = (Math.sin((index + 1) * 12.9898) * 43758.5453) % 1;
        const jitter = Math.abs(random);
        const sizeFactor = (s.pressureSize ? pressure : 1) * (1 - s.velocitySize * velocity) * (1 - s.sizeJitter * jitter * .5);
        const opacityFactor = (s.pressureOpacity ? pressure : 1) * (1 - s.velocityOpacity * velocity) * (1 - s.opacityJitter * jitter * .5);
        return { ...point, pressure, velocity, size: Math.max(1, s.size * sizeFactor), opacity: clamp(s.opacity * opacityFactor, .01, 1), rotation: s.angle + (jitter - .5) * s.rotationJitter };
    });
}
export function predictPaintEndpoint(points, amount) {
    const strength = clamp(amount, 0, 1);
    if (points.length < 2 || strength === 0)
        return points.map(point => ({ ...point }));
    const result = points.map(point => ({ ...point }));
    const a = points[points.length - 2], b = points[points.length - 1];
    result[result.length - 1] = { ...b, x: b.x + (b.x - a.x) * strength * .35, y: b.y + (b.y - a.y) * strength * .35 };
    return result;
}
