const clamp = (v, min, max) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const DEFAULT_RASTER_RUNTIME = {
    performance: { backend: "webgl2", tileSize: 512, maxMemoryMB: 1024, workerCount: 4, gpuAcceleration: true, progressivePreview: true, proxyScale: .5, diskCache: true, incrementalSave: true },
    brush: { size: 40, hardness: .8, spacing: .12, flow: 1, opacity: 1, smoothing: .35, pressureSize: true, pressureOpacity: false, tilt: false, scatter: 0, wetEdges: false },
    selection: { mode: "replace", marchingAnts: true, edgeRefine: 0, decontaminateColors: false, hairRefinement: false, magicWandTolerance: 32, contiguous: true },
    color: { linearLight: true, floatingPoint: true, iccEnabled: true, preserveOutOfGamut: true },
    jobs: [], tiles: [],
    layeredExport: { format: "yaposan-raster", preserveLayers: true, preserveMasks: true, preserveSmartObjects: true, preserveChannels: true, embedProfile: true, compression: "zip" },
    undoLimit: 200, redoCount: 0, checkpointInterval: 30, crashRecovery: true,
};
export function normalizeRasterRuntime(state) {
    const s = { ...DEFAULT_RASTER_RUNTIME, ...state };
    return {
        ...s,
        performance: { ...DEFAULT_RASTER_RUNTIME.performance, ...state?.performance, tileSize: clamp(Number(state?.performance?.tileSize ?? 512), 128, 2048), maxMemoryMB: clamp(Number(state?.performance?.maxMemoryMB ?? 1024), 128, 32768), workerCount: clamp(Number(state?.performance?.workerCount ?? 4), 1, 32), proxyScale: clamp(Number(state?.performance?.proxyScale ?? .5), .05, 1) },
        brush: { ...DEFAULT_RASTER_RUNTIME.brush, ...state?.brush, size: clamp(Number(state?.brush?.size ?? 40), 1, 2000), hardness: clamp(Number(state?.brush?.hardness ?? .8), 0, 1), spacing: clamp(Number(state?.brush?.spacing ?? .12), .01, 2), flow: clamp(Number(state?.brush?.flow ?? 1), 0, 1), opacity: clamp(Number(state?.brush?.opacity ?? 1), 0, 1), smoothing: clamp(Number(state?.brush?.smoothing ?? .35), 0, 1), scatter: clamp(Number(state?.brush?.scatter ?? 0), 0, 10) },
        selection: { ...DEFAULT_RASTER_RUNTIME.selection, ...state?.selection, edgeRefine: clamp(Number(state?.selection?.edgeRefine ?? 0), 0, 250), magicWandTolerance: clamp(Number(state?.selection?.magicWandTolerance ?? 32), 0, 255) },
        color: { ...DEFAULT_RASTER_RUNTIME.color, ...state?.color }, jobs: (state?.jobs ?? []).slice(-100), tiles: state?.tiles ?? [],
        layeredExport: { ...DEFAULT_RASTER_RUNTIME.layeredExport, ...state?.layeredExport }, undoLimit: clamp(Number(state?.undoLimit ?? 200), 10, 1000), redoCount: Math.max(0, Number(state?.redoCount ?? 0)), checkpointInterval: clamp(Number(state?.checkpointInterval ?? 30), 5, 300), crashRecovery: state?.crashRecovery !== false,
    };
}
export function setRasterRuntime(element, patch) { return { ...element, rasterRuntime: normalizeRasterRuntime({ ...element.rasterRuntime, ...patch }), rasterEditedAt: Date.now() }; }
export function configureRasterPerformance(element, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { performance: { ...r.performance, ...patch } }); }
export function configureRasterBrush(element, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { brush: { ...r.brush, ...patch } }); }
export function configureRasterSelectionRuntime(element, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { selection: { ...r.selection, ...patch } }); }
export function configureRasterColorPipeline(element, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { color: { ...r.color, ...patch } }); }
export function configureLayeredRasterExport(element, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { layeredExport: { ...r.layeredExport, ...patch } }); }
export function queueRasterJob(element, kind, label) { const r = normalizeRasterRuntime(element.rasterRuntime); const job = { id: uid("rjob"), kind, label, status: "queued", progress: 0, cancellable: true, createdAt: Date.now() }; return setRasterRuntime(element, { jobs: [...r.jobs, job] }); }
export function updateRasterJob(element, jobId, patch) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { jobs: r.jobs.map(j => j.id === jobId ? { ...j, ...patch, progress: clamp(Number(patch.progress ?? j.progress), 0, 1) } : j) }); }
export function cancelRasterJob(element, jobId) { return updateRasterJob(element, jobId, { status: "cancelled", completedAt: Date.now() }); }
export function buildRasterTiles(width, height, tileSize = 512, level = 0) { const out = []; for (let y = 0; y < height; y += tileSize)
    for (let x = 0; x < width; x += tileSize)
        out.push({ id: uid("tile"), x, y, width: Math.min(tileSize, width - x), height: Math.min(tileSize, height - y), level, dirty: true, cacheKey: `${level}:${x}:${y}:${tileSize}` }); return out; }
export function initializeRasterTiles(element, width = 4096, height = 4096) { const r = normalizeRasterRuntime(element.rasterRuntime); return setRasterRuntime(element, { tiles: buildRasterTiles(width, height, r.performance.tileSize) }); }
export function checkpointRasterRuntime(element) { return setRasterRuntime(element, { lastCheckpointAt: Date.now(), redoCount: 0 }); }
export function buildRasterExecutionManifest(element) { const r = normalizeRasterRuntime(element.rasterRuntime); return { backend: r.performance.backend, gpu: r.performance.gpuAcceleration, workers: r.performance.workerCount, tiles: r.tiles.length, bitDepth: element.rasterColorProfile?.bitDepth ?? 16, linearLight: r.color.linearLight, floatingPoint: r.color.floatingPoint, icc: r.color.iccEnabled, smartFilters: element.rasterSmartFilters?.length ?? 0, adjustments: element.rasterAdjustments?.length ?? 0, masks: element.rasterMasks?.length ?? 0, selections: element.rasterSelections?.length ?? 0, retouch: element.rasterRetouchStrokes?.length ?? 0, raw: Boolean(element.rasterRawDevelopment?.enabled), hdr: Boolean(element.rasterHDR?.enabled), composite: element.rasterCompositeStack?.mode ?? "none", layeredExport: r.layeredExport.format }; }
export function auditRasterRuntime(element) { const r = normalizeRasterRuntime(element.rasterRuntime); const issues = []; if (!r.performance.gpuAcceleration)
    issues.push({ severity: "warning", message: "GPU acceleration is disabled.", fix: "Enable GPU acceleration for production-size images." }); if ((element.rasterColorProfile?.bitDepth ?? 16) > 8 && !r.color.floatingPoint)
    issues.push({ severity: "error", message: "High-bit-depth document requires floating-point processing." }); if (element.rasterRawDevelopment?.enabled && !r.color.iccEnabled)
    issues.push({ severity: "warning", message: "RAW development should use ICC color management." }); if (r.performance.maxMemoryMB < 512)
    issues.push({ severity: "warning", message: "Raster memory budget is below 512 MB." }); if (!r.crashRecovery)
    issues.push({ severity: "warning", message: "Crash recovery is disabled." }); if (!issues.length)
    issues.push({ severity: "info", message: "Phase 17.8 raster runtime is production-configured." }); return issues; }
export async function processRasterJobs(element, executor) { let current = element; const jobs = normalizeRasterRuntime(current.rasterRuntime).jobs.filter(j => j.status === "queued"); for (const job of jobs) {
    current = updateRasterJob(current, job.id, { status: "running", progress: .01 });
    try {
        await executor(job, (progress) => { current = updateRasterJob(current, job.id, { status: "running", progress }); });
        current = updateRasterJob(current, job.id, { status: "complete", progress: 1, completedAt: Date.now() });
    }
    catch (error) {
        current = updateRasterJob(current, job.id, { status: "failed", error: error instanceof Error ? error.message : String(error), completedAt: Date.now() });
    }
} return current; }
export function markRasterTilesDirty(element, bounds) { const r = normalizeRasterRuntime(element.rasterRuntime); const intersects = (t) => !bounds || !(t.x + t.width < bounds.x || t.y + t.height < bounds.y || t.x > bounds.x + bounds.width || t.y > bounds.y + bounds.height); return setRasterRuntime(element, { tiles: r.tiles.map(t => intersects(t) ? { ...t, dirty: true, cacheKey: `${t.cacheKey}:${Date.now()}` } : t) }); }
