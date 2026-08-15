# Phase 91.6 — Commercial Product Photo Quality

91.6 is the final planned major quality-engineering layer before benchmark-driven tuning.

It adds dedicated fine-edge/semi-transparent matting, final-visible-result candidate scoring, conservative product-integrity guards, warm-pool readiness, 50-user load-certification requirements, visual-regression evidence requirements, and a 500-image category benchmark.

## Safety and cost
- Merchandise pixels are never generatively replaced by the background-removal path.
- Paid per-image fallback remains disabled by default with a $0 monthly budget and no overage.
- No PhotoRoom/remove.bg/Removal.AI parity claim is made without benchmark evidence.

## Required production proof
Run the benchmark on at least 500 representative product images and run load certification in the real deployment environment. Visual-regression certification requires approved reference images; they are intentionally not fabricated in source control.
