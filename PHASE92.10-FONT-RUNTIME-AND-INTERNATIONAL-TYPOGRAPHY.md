# Yaposan Publisher 92.10 — Font Runtime & International Typography

Version 92.10 turns the 92.9 multilingual catalog into a more functional typography system.

## Added

- Desktop web local-font discovery through the Local Font Access API when the browser supports it and the user grants permission.
- Persistent local-font discovery cache for the font picker.
- TTF, OTF, WOFF, and WOFF2 project-font import remains available as the cross-platform fallback.
- Font Manager categories for Local and Custom fonts.
- Script-aware search and script metadata for multilingual families.
- Live multilingual preview strings for Arabic, Hebrew, Ethiopic, Indic, CJK, Southeast Asian, Cyrillic, Greek, Georgian, Armenian, Tibetan, and Mongolian families.
- “Compatible with selected text” filtering in Font Manager.
- Automatic Unicode script detection and RTL/LTR direction detection.
- Script-aware CSS fallback stacks for mixed-language text.
- RTL-aware canvas rendering and inline editing.
- RTL and fallback metadata in SVG and web publishing exports.
- Embedded project fonts are recognized as available by font diagnostics.
- The quick font dropdown now includes discovered local and embedded project font families in addition to the built-in catalog.

## Runtime notes

Local Font Access is browser/platform dependent and may require user permission. When it is unavailable, users can still import font files into the project. Catalog entries do not bundle proprietary font binaries; rendering depends on installed, imported, embedded, or platform-provided fonts. PDF export continues to embed project-imported fonts when the export option enables font embedding.

## Validation

Run:

```bash
npm run test:phase92.10
```

For a full dependency-installed validation environment:

```bash
npm run verify:phase92.10
```
