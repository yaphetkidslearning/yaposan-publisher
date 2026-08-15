# Phase 91.1 — Organization Quality Certification and Pilot Readiness

Phase 91.1 adds the evidence gate needed before Yaposan is rolled out to 50 organization users or described as competitive with PhotoRoom/Removal.AI for the tested organization workload.

## Added

- A strict CSV evidence schema and ready-to-fill benchmark template.
- A benchmark evaluator that calculates overall and category acceptance rates, auto-pass/review rates, manual-touch-up rate, processing time, paid API spend, critical product mutation, original-file loss, and blind preference.
- A release policy that requires at least 200 representative images (500 recommended), zero unexpected paid API spend, zero critical product mutation, zero original-file loss, and category-specific quality thresholds.
- A certification rule that refuses a competitive-quality claim until real organization evidence passes.
- Phase 91.1 test/check/verify gates and top-level regression coverage.

## Run the real benchmark

Copy `release/phase91.1/benchmark-template.csv`, add one row per real product photo, then run:

```bash
npm run benchmark:phase91.1 -- path/to/organization-benchmark.csv --write release/phase91.1/latest-benchmark-report.json
```

A PASS means the collected evidence meets the configured organization quality floor. It does **not** prove universal equivalence to any competitor outside the tested workload.

## Rollout

Use the required staged rollout: 2 → 5 → 10 → 50 employees. Do not advance a stage if users are frequently reprocessing photos in another tool, critical product pixels are changed, originals are lost, or unexpected paid API spend occurs.

## Final verification

```bash
npm ci
npm run verify:phase91.1
```
