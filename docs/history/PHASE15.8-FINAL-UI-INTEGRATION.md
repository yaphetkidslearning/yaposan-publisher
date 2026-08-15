# Phase 15.8 — Final UI Integration and Live Regeneration

Phase 15.8 closes the remaining Phase 15 integration gaps.

## Completed

- Chart property changes regenerate SVG output immediately.
- Axis minimum/maximum, gridlines, labels and legend metadata are applied to rendering.
- Calendar year, month and event changes regenerate visible calendar cells.
- Table formulas can be recalculated from the Properties panel and preserve formula errors.
- Linked data-source registries are project-persisted and auditable.
- New diagram nodes create connectors automatically.
- Phase 15.8 regression tests cover formulas, chart rendering, calendar regeneration, diagrams and source persistence.

## Verification

Run:

```powershell
npm install
npx tsc --noEmit
npm run verify:phase15.8
```
