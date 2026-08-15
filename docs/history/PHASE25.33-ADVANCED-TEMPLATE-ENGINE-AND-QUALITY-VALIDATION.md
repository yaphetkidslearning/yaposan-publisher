# Phase 25.33 — Advanced Template Engine and Quality Validation

## Included

- A real template quality audit engine in `src/templates/templateQualityAudit.ts`.
- Weighted scoring for metadata, editability, content, layout, typography, and color.
- A 0–100 score, A–F grade, pass/fail threshold, and actionable findings.
- Whole-library audit summaries with total, passed, failed, and average score.
- Detection for sparse pages, overly dense layouts, out-of-bounds elements, tiny text, weak metadata, empty content, and inconsistent palettes.
- Automated Phase 25.33 tests.
- New commands:
  - `npm run test:phase25.33`
  - `npm run verify:phase25.33`
- Project version updated to `25.33.0`.

## Purpose

This release turns the template quality work into measurable code. Templates can now be reviewed consistently instead of relying only on manual visual inspection.
