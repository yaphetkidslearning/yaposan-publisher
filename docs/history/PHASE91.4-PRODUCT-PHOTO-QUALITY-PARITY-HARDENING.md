# Phase 91.4 — Product Photo Quality Parity Hardening

Phase 91.4 strengthens the self-hosted Product Photo Engine toward commercial background-removal quality while keeping the platform organization-neutral and preventing surprise paid-provider spend.

## Added in 91.4

- EXIF orientation normalization before inference.
- Standard/detail model candidate comparison in maximum-quality mode.
- Automatic detail candidate on difficult, low-score, or review-worthy images.
- Binary mask IoU agreement check; large model disagreement is sent to review instead of being silently accepted.
- Foreground coverage, soft-alpha, border leakage, connected-component fragmentation, and bounding-box diagnostics.
- Warm-up endpoint for production model loading.
- Original-product-pixel-only policy is returned with every result. Manual correction restores original pixels or removes background pixels; it does not generate replacement merchandise.
- Manual correction no longer changes an AI confidence score to an artificial 100%.
- The environment example, service defaults, and model policy now consistently use `birefnet-general` as the detail model.
- Phase 91.4 blind parity benchmark and evaluator.

## What 91.4 does NOT claim

91.4 is not automatically certified as equal to PhotoRoom, remove.bg, Removal.AI, or any other commercial service. The quality target is only considered met for a tested workload when representative real product photos pass `release/phase91.4/parity-policy.json` in a blind comparison against the organization's current production tool.

## Cost rule

The default production path remains self-hosted. Paid per-image providers are disabled, monthly paid-provider budget remains $0, and automatic overage remains disabled.

## Verification

```bash
npm run test:phase91.4
npm run check:phase91.4
npm run verify:phase91.4
```

For real parity evidence:

```bash
npm run benchmark:phase91.4 -- release/phase91.4/benchmark.csv --write release/phase91.4/latest-parity-report.json
```
