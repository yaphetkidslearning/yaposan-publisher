# Phase 10.2 — Merge Fields, Variables, and AI Integration Polish

## Included

- Project-level variable fields saved with each publication
- CSV merge-record import with quoted-cell support
- Active merge-record selection and preview
- Dynamic date, time, date/time, page number, total pages, auto number, and project-name fields
- Insert merge tokens into selected text or create a new text box
- Detect merge fields used throughout a publication
- Resolve the active merge record across all document pages
- Undo/redo, save/load, recovery, and export compatibility through the existing project model
- Unified AI Writing Suite Fields tab; no duplicate editor or disconnected demo pages
- Full Phase 8–10.2 regression suite

## Verification

```powershell
npm install
npm run verify:phase10.2
```

Expected result: TypeScript reports zero errors and all regression tests pass.
