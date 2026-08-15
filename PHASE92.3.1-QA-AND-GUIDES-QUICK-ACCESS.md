# Phase 92.3.1 — QA & Guides Quick Access UI

## Purpose

Make production quality checks and layout guide visibility reachable from the Publisher title bar without navigating through ribbon tabs.

## Changes

- Added an always-visible **QA / Quality** quick-access button in Publisher.
- The QA button opens the existing Prepress/Preflight manager; no duplicate QA engine was created.
- Added an always-visible **Guides** quick-access button.
- The Guides button directly shows/hides the existing dashed/dotted layout-guide overlay.
- The Guides button reflects its current enabled state.
- Existing Grid, Snap, Layout Manager, ruler-created guides, margin/bleed/safe guides, and smart-guide systems remain intact.

## Verification

Run:

```bash
npm run typecheck
npm run test:phase92.3.1
```
