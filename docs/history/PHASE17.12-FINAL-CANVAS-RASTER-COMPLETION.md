# Phase 17.12 — Final Canvas Raster Completion

Phase 17.12 closes the remaining in-app raster interaction gap by connecting saved non-destructive raster operations to the real Publisher canvas.

## Added

- Direct canvas brush, eraser, clone, and healing interaction for selected images
- Rectangle, ellipse, and lasso selection drawing on the canvas
- Live pointer-path preview and active-tool badge
- Non-destructive canvas strokes saved into the raster document model
- Brush color persistence and eraser alpha execution
- Selection persistence compatible with mask execution
- Phase 17.12 type/version support and regression tests

## Platform boundary

The bundled implementation provides complete browser/TypeScript CPU raster editing for the Yaposan roadmap. Camera-vendor RAW decoding, full ICC/CMYK conversion, Adobe PSD compatibility, layered TIFF serialization, and hardware GPU kernels remain optional native/WASM provider integrations because those require external codecs or platform-specific binaries.
