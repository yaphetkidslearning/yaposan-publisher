# Phase 17.8 — Final Real Raster Completion

Phase 17.8 consolidates the planned 17.4–17.7 milestones into one production architecture.

## Included
- Pluggable WebGPU, WebGL2, Skia, Canvas2D and CPU backend profiles
- Tiled image rendering, dirty tiles and cache keys
- Worker, memory, proxy-preview, disk-cache and incremental-save controls
- Pressure, tilt, flow, opacity, hardness, spacing, smoothing, texture, scatter and wet-edge brush dynamics
- Add/subtract/intersect selection execution, marching ants, magic-wand tolerance, hair/edge refinement
- Linear-light floating-point ICC color pipeline
- Queued and cancellable render, filter, RAW, HDR, panorama, focus-stack and export jobs
- Layer-preserving Yaposan raster, PSD-compatible and layered TIFF delivery plans
- Runtime checkpoints, crash recovery and extended undo limits
- Runtime audit and deterministic execution manifest

## Important implementation boundary
This package provides the complete editor-facing runtime contract, state, tiling, execution queue, professional controls, persistence and tests. Platform-specific native kernels still plug into this contract: WebGPU/WebGL shaders on web and Skia/native codecs on mobile/desktop. The TypeScript layer does not claim to decode proprietary camera RAW formats or execute GPU shaders without those platform modules.
