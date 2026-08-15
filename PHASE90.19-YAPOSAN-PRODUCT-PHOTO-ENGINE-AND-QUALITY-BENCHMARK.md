# Phase 90.19 — Yaposan Product Photo Engine and Quality Benchmark

Phase 90.19 adds the cost-safe foundation for high-volume organizational background removal without making Yaposan dependent on a paid per-image API.

## What is included

- `product-photo-studio` batch UI for transparent PNG or white-background output.
- Authenticated Yaposan API route: `POST /api/v1/image/background-remove`.
- Self-hosted provider boundary in `server/backgroundRemoval.ts`.
- Optional Dockerized `rembg` service in `services/background-removal/`.
- No Removal.AI or PhotoRoom key is required and no paid fallback is enabled by default.
- Hard release evidence that paid-provider budget is $0 in this phase.
- 100–200 image blind quality benchmark protocol before any claim of PhotoRoom/Removal.AI equivalence.
- Model/license review artifact that prevents accidentally shipping a commercially restricted model.

## Cost objective

Yaposan's application does not incur a per-image third-party API charge when the self-hosted engine is used. Infrastructure compute/storage/bandwidth can still cost money and must be measured during the pilot.

## organization pilot rule

Do not promise "unlimited" and do not claim parity with PhotoRoom/Removal.AI until the benchmark evidence is completed. Start with representative organization product photos and measure actual daily volume, throughput, quality and manual-repair rate.

## Production activation

1. Review/approve the exact model-weight license.
2. Build and run `services/background-removal`.
3. Point the Yaposan API to it with `BACKGROUND_REMOVAL_URL`.
4. Run `npm run verify:phase90.19`.
5. Run the blind 100–200 image quality benchmark and record evidence.
