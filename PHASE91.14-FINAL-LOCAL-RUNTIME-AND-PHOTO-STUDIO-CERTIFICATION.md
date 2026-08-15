# Phase 91.14 — Final Local Runtime and Photo Studio Certification

This phase closes the remaining 91.13 audit items: strict typecheck/build gates, local runtime probes, provider-readiness reporting, a browser color picker, difficult-subject quality acceptance, tool-specific Photo Studio controls, Magic Eraser mask transport, and explicit provider dependency behavior for What Will You Create Today.

## Commands

```bash
npm ci
npm run verify:phase91.14
docker compose up --build background-removal
npm run server
npm run web
npm run certify:local:91.14
```

Full certification requires the interactive checklist in `docs/PHASE91.14-PHOTO-QUALITY-ACCEPTANCE.md`. External image/video/audio provider credentials are intentionally not bundled.
