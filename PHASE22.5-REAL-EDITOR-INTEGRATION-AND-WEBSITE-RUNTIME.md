# Phase 22.5 — Real Editor Integration and Website Runtime

Phase 22.5 connects the Phase 22 digital-publishing data model to the real Yaposan editor.

## Included
- New **Digital** ribbon tab.
- Digital Publishing Studio modal launched from the editor.
- Desktop, tablet, and mobile workspace switching.
- Design, live, SEO, social, accessibility, and performance preview modes.
- Page-to-route runtime manifest.
- Navigation, forms, analytics, deployment, and preflight workspaces.
- Automatic migration from Phase 22.4 to 22.5.
- Runtime validation summary and deterministic report checksum.
- Save/load-compatible project state through `PublisherProject.digitalPublishingEditor`.
- Phase 22.5 regression tests and verification scripts.

## Main files
- `src/utils/digitalPublishingEditorIntegrationEngine.ts`
- `src/components/publisher/DigitalPublishingStudioModal.tsx`
- `tests/phase225-real-editor-runtime-integration.test.ts`

## Verification
```powershell
npm install
npx tsc --noEmit
npm run verify:phase22.5
```

Phase 22.6 remains the final production step for generated HTML/CSS/JavaScript files, hosted preview, live form endpoints, and provider deployment adapters.
