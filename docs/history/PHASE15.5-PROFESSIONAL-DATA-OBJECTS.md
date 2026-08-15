# Phase 15.5 — Professional Data Objects

Phase 15.5 adds linked and summarized data objects to the real Yaposan Publisher editor.

## Included

- CSV/TSV parser with quoted-field support
- JSON row-data parser
- Linked data-source metadata and status tracking
- Manual and on-open refresh policies
- Missing-source and broken-link warnings
- Relink and replace-source helpers
- Grouped summaries and totals
- Subtotals and grand totals
- Pivot-style row/column summaries
- Sum, average, count, minimum and maximum calculations
- Linked charts that retain their source fields
- QR-code tables
- Barcode tables
- Refresh existing linked tables, charts and summaries while preserving canvas position and size
- Insert workspace integration under the new Data tab

## Editor path

Insert → Chart & Calendar → Data

## Validation

- `npm run test:phase15.5`
- `npm run verify:phase15.5`
