# Phase 13.0 — Professional Printing & Prepress

Phase 13 adds a production-focused print workflow to the real Yaposan Publisher editor.

## Included

- Dedicated Prepress Manager in the File ribbon
- Commercial, desktop, booklet, and proof presets
- RGB-to-CMYK output intent and press profiles
- PDF, PDF/X-1a, PDF/X-3, and PDF/X-4 standards
- Rich black, black overprint, spot-color preservation, ink-limit controls
- Transparency flattening controls
- Bleed, crop marks, bleed marks, registration marks, color bars, and page information
- Simplex, duplex, binding, signature, gutter, creep, copies, collate, and scaling data model
- None, booklet, two-up, four-up, and step-and-repeat imposition
- Booklet blank-page padding and sheet ordering
- Production preflight for missing bleed, unembedded fonts, overset text, missing images, off-page objects, RGB conversion, transparency, and invalid settings
- Preflight issue navigation to affected pages and objects
- Project save/load and package compatibility
- Six Phase 13 regression tests

## Validation

```bash
npm run typecheck
npm run test:phase13.0
npm run verify:phase13.0
```
