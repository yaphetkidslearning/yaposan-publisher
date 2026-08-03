export const DEFAULT_RETOUCH_SETTINGS = {
    tool: "smudge", size: 42, strength: .45, hardness: .35, flow: .55, spacing: .08, smoothing: .5,
    pressureSize: true, pressureStrength: true, protectAlpha: true, sample: "current-and-below", mode: "non-destructive",
    liquifyDensity: .6, liquifyRate: .5, smudgeMix: .65, smudgeLoad: .35, cloneAligned: true,
    healingDiffusion: .55, dodgeBurnRange: "midtones", spongeMode: "saturate",
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
export function normalizeRetouchSettings(value) {
    const s = { ...DEFAULT_RETOUCH_SETTINGS, ...value };
    return { ...s, size: clamp(Number(s.size), 1, 500), strength: clamp(Number(s.strength), 0, 1), hardness: clamp(Number(s.hardness), 0, 1), flow: clamp(Number(s.flow), .01, 1), spacing: clamp(Number(s.spacing), .01, 2), smoothing: clamp(Number(s.smoothing), 0, 1), liquifyDensity: clamp(Number(s.liquifyDensity), 0, 1), liquifyRate: clamp(Number(s.liquifyRate), 0, 1), smudgeMix: clamp(Number(s.smudgeMix), 0, 1), smudgeLoad: clamp(Number(s.smudgeLoad), 0, 1), healingDiffusion: clamp(Number(s.healingDiffusion), 0, 1) };
}
export function createRetouchOperation(settings) {
    const normalized = normalizeRetouchSettings(settings);
    return { id: `retouch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, tool: normalized.tool, settings: normalized, createdAt: new Date().toISOString(), enabled: true };
}
export function appendRetouchOperation(element, settings) {
    const operation = createRetouchOperation(settings);
    const stack = [...(element.retouchOperations ?? []), operation];
    return { retouchSettings: operation.settings, retouchOperations: stack, phase18Version: "18.2" };
}
export function toggleRetouchOperation(element, id) {
    return { retouchOperations: (element.retouchOperations ?? []).map(op => op.id === id ? { ...op, enabled: !op.enabled } : op), phase18Version: "18.2" };
}
export function removeRetouchOperation(element, id) {
    return { retouchOperations: (element.retouchOperations ?? []).filter(op => op.id !== id), phase18Version: "18.2" };
}
export function buildRetouchManifest(element) {
    const stack = element.retouchOperations ?? [];
    return { phase: "18.2", operations: stack.length, enabled: stack.filter(op => op.enabled).length, tools: Array.from(new Set(stack.map(op => op.tool))), latest: stack.at(-1)?.createdAt };
}
