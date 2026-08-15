# Phase 17.0 — Professional Raster & Photo Editing Foundation

Phase 17 begins Yaposan's full raster and photo-editing workspace inside the existing editor.

## Integrated capabilities
- Photo Studio entry point in Picture Format
- Non-destructive brightness, contrast, exposure, highlights and shadows
- Saturation, temperature and tint controls
- Original, vivid, portrait, cinematic and monochrome presets
- Adjustment-layer stack with enable, opacity, blend mode and settings data
- Vector-based raster masks with feather, opacity and inversion support
- Healing brush, clone stamp and dodge/burn document state
- Lens, perspective and chromatic-aberration correction state
- Raster edit history snapshots
- Image audit and project summary
- Existing web pixel-processing bake handoff
- Existing background-removal integration
- Save/load-safe Phase 17 fields

## Verification
```powershell
npm install
npx tsc --noEmit
npm run verify:phase17.0
```
