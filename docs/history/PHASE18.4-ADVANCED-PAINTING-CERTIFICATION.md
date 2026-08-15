# Phase 18.4 — Advanced Painting Certification

Phase 18.4 closes the advanced painting roadmap on top of Phases 18.0–18.3.

## Integrated capabilities
- Custom brush-tip geometry, angle, roundness, spacing, multi-tip count and deterministic seed
- Natural-pigment, subtractive and RGB mixer profiles
- Editable stroke/timelapse recording metadata
- Mouse, generic pen, Windows Ink, Apple Pencil and Wacom input profiles
- Pressure-curve evaluation, tilt, barrel rotation and palm-rejection preferences
- Tiled large-canvas memory planning
- 8-bit, 16-bit and 32-bit production profiles with optional HDR preview
- Native, PSD-compatible, OpenRaster-compatible and flattened interchange manifests
- Embedded brush and timelapse packaging flags

## Integration
The Advanced Painting Studio is available from the real Paint ribbon and writes non-destructive settings to the selected publisher element. Existing Phase 18 brush, retouch, layers, masks, symmetry, perspective and pattern metadata is preserved.

## Certification boundary
Native hardware drivers, operating-system pen events, GPU shaders, PSD binary encoding and HDR display output still depend on platform/runtime adapters. Phase 18.4 supplies the editor-facing controls, normalized data model, pressure evaluation, memory planning and interchange manifests required for those adapters.
