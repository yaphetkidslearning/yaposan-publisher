# Phase 17.9 — Final Pixel Execution

Phase 17.9 closes the TypeScript-accessible raster execution gap with concrete pixel buffers and CPU fallbacks.

## Implemented

- 8-bit, 16-bit, and 32-bit float RGBA buffers
- Bit-depth conversion
- Brightness, contrast, exposure, saturation
- Blur, unsharp mask, and edge detection
- Executable rectangle selections and selection math
- Pressure-aware raster brush rendering
- Eraser rendering
- Clone stamp and healing execution
- HDR exposure fusion
- Focus stacking
- Runtime capability detection for WebGPU, WebGL2, Skia, Canvas 2D, and CPU
- Native codec registration checks for camera RAW, ICC, and PSD
- Pixel execution certification

## Native boundaries

Camera-vendor RAW decoding, complete ICC/CMYK conversion, and fully compatible Adobe PSD serialization require native or WebAssembly codecs. Phase 17.9 exposes capability checks and keeps Yaposan layered documents as the lossless native format when those codecs are not installed.
