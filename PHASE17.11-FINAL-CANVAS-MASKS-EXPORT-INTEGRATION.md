# Phase 17.11 — Final Canvas, Masks and Export Integration

Phase 17.11 closes the remaining raster integration gaps with a single non-destructive execution bridge.

## Included

- Original/preview/rendered image URI separation
- Browser codec fallback plus native/WASM codec registration API
- Rectangle, ellipse and polygon selection-mask execution
- Raster-mask conversion and combined mask execution
- Layer/filter opacity and blend compositing primitives
- Crop execution before filters
- Retouch-stroke execution for brush-style dodge/burn, clone and healing
- Full render pipeline entry point
- Automatic queued render/filter/export job execution
- Raster stroke session begin/append/commit helpers
- Dirty-tile invalidation on stroke commit
- Restore-original workflow
- Phase 17.11 audit and tests

## Platform boundary

The core pipeline is executable in TypeScript. Native camera RAW, ICC/CMYK and PSD/TIFF layered codecs remain adapter-based because they require platform-specific native or WebAssembly libraries. The new `registerRasterCodecAdapter()` API is the supported integration point for those codecs.
