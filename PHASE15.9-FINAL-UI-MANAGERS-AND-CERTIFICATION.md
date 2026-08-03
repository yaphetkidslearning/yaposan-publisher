# Phase 15.9 — Final UI Managers and Certification

Phase 15.9 closes the remaining Phase 15 workflow gaps.

## Added

- Dedicated Phase 15.9 manager opened from the selected object's Properties panel.
- Existing chart data editor with chart-type conversion and live regeneration.
- Calendar event creation, listing, and deletion with immediate calendar redraw.
- Smart diagram node creation/deletion, horizontal/vertical relayout, and connector rebuilding.
- Project-level linked data source inventory with worksheet, status, row count, missing-source, and removal controls.
- Phase 15 export-readiness regression audit for charts, calendars, formulas, diagrams, linked sources, and invalid dimensions.
- Final manager engine and automated Phase 15.9 tests.

## Verification

```powershell
npm install
npx tsc --noEmit
npm run test:phase15.9
npm run verify:phase15.9
```

Phase 16 should begin only after the complete verification command returns successfully.
