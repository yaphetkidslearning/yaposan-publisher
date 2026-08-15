# Phase 14.0 — Mail Merge Data Foundation

Phase 14.0 establishes the production data layer and editor entry point for Variable Data Publishing.

## Integrated capabilities
- Real Mailings ribbon commands in the existing editor
- Multi-source manager stored inside project serialization and auto-save
- CSV, TSV, JSON and Excel/XLSX import
- Quoted delimiter parsing and nested JSON flattening
- All-sheet Excel ingestion with sheet provenance
- Automatic field type detection: text, number, currency, date, boolean, email, URL and image URL
- Record and field preview
- Duplicate record detection
- Validation issue reporting
- Global record search
- Field sorting
- Extensible record filter engine
- Merge-field insertion into selected text elements
- Local device/browser parsing; no upload service required
- Undo history integration for project changes and field insertion

## Validation
Run `npm run verify:phase14.0`.
