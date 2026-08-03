# Phase 12.6 - Live Canvas Layout Integration and Final Completion

Phase 12.6 completes the layout engine with reusable live-canvas behavior for priority-aware snapping, Alt-key snap override, ruler guide conversion, pasteboard bounds, facing-page spread geometry, layer visibility/export enforcement, live anchor refresh, and circular-anchor diagnostics.

## Integration contract

- `resolveLiveSnap` applies document snap tolerance, magnet strength, configured priority, object edges/centers, page, margins, guides, and grid targets.
- `guideFromRuler` and `applyGuideDrop` provide zoom-correct ruler-to-document guide creation.
- `pasteboardBounds` provides the expanded workspace geometry used by canvas hosts.
- `spreadGeometry` lays out single or facing pages with page gaps and spread indices.
- `layerAllowsRendering` centralizes canvas/export layer visibility.
- `refreshLiveAnchors` updates page, margin, and frame anchors while avoiding circular references.

The implementation remains backward-compatible with Phase 12.0-12.4 project files.
