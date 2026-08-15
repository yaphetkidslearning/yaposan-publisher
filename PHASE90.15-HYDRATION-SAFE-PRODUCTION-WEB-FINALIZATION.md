# Phase 90.15 — Hydration-Safe Production Web Finalization

## Purpose

Phase 90.15 resolves the production web failures observed after Phase 90.14 by removing two independent causes of React startup/hydration errors.

## Fixes

1. `RootLayout` now imports `Head` from `expo-router/head` instead of treating `Head` as a named export of `expo-router`. This prevents React error #130 (`Element type is invalid`).
2. SEO metadata is owned by `src/app/_layout.tsx`. `src/app/+html.tsx` is reduced to the document shell and `ScrollViewStyleReset`, preventing duplicate titles and head tags.
3. `build:web` now uses `expo export --platform web` directly. The Phase 90.14 post-export HTML mutator is no longer invoked, preventing server HTML from diverging from React's hydration expectations.
4. Phase 90.14 verification/tests are updated to validate the repaired architecture rather than the obsolete postprocessor architecture.
5. Phase 90.15 adds regression checks for the Head import, duplicate head metadata, untouched Expo export, and exactly one production title.

## Validation

Run:

```powershell
npm run typecheck
npm run test:phase90.14
npm run test:phase90.15
npm run build:web
npm run check:phase90.14
npm run check:phase90.15
```

Expected production behavior:

- Yaposan renders instead of a blank page.
- React error #130 is absent.
- The exported document contains one React-managed Yaposan title.
- The production build is not mutated after Expo static rendering.
- Hydration error #418 caused by duplicate/postprocessed head markup is not introduced by the build pipeline.


## Source packaging hardening

To prevent the oversized-release problem seen during handoff, Phase 90.15 now includes:

```powershell
npm run package:source
```

This creates `Yaposan-90.15-source.zip` after dependencies are installed. The package intentionally excludes `node_modules`, `dist`, `.git`, Expo/build caches, coverage, logs, Gitleaks reports, nested ZIPs, and real `.env*` files while retaining `.env*.example` setup templates.

This keeps the handoff archive small and avoids accidentally shipping local dependencies, generated output, or secrets.
