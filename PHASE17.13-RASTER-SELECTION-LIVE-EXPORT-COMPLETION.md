# Phase 17.13 Raster Selection, Live Overlay and Export Completion

Phase 17.13 closes the remaining browser raster integration gaps: active saved selections now participate in the pixel pipeline, feather/expand/contract/antialias are executed, selection modes are honored when drawing, saved selection boundaries remain visible, clone strokes can use a persisted source point, queued render/filter/export jobs encode and retain their output, and job output metadata is stored.

Native RAW, ICC/CMYK, PSD/layered TIFF and GPU kernels remain provider-backed platform capabilities rather than TypeScript browser fallbacks.
