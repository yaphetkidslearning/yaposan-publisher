# Yaposan 91.5 self-hosted Product Photo Engine

This service is Yaposan's organization-controlled background-removal and product-photo quality path. It does not call a paid per-image provider.

## 91.5 quality pipeline

1. EXIF orientation and full-resolution input validation (up to the configured 50 MP ceiling).
2. Visual-condition and optional product-category routing.
3. Up to three candidates: standard segmentation, detail alpha matting, and a softer detail matte for fragile edges.
4. Semi-transparent alpha preservation, conservative thin-structure recovery, halo/color-spill decontamination, hole/fragment/border diagnostics and product-geometry checks.
5. Category-aware candidate ranking plus model-agreement review.
6. Optional natural-shadow extraction, deterministic catalog crop/center/padding and optional explicit lighting normalization.
7. PASS/REVIEW output with geometry, diagnostics, model strategy, category, processing time and zero paid-API cost metadata.

The quality score is a safety/review heuristic, not proof that a cutout is correct. Use the Phase 91.5 category benchmark before making a competitive-quality claim.

## CPU deployment

```bash
docker compose up --build background-removal
```

## GPU deployment

Install the NVIDIA Container Toolkit on the host, then run:

```bash
docker compose --profile gpu up --build background-removal-gpu
```

The GPU image uses `rembg[gpu]`. The standard image uses `rembg[cpu]`, providing the CPU-compatible fallback path when GPU infrastructure is unavailable.

## Server configuration

```text
BACKGROUND_REMOVAL_URL=http://127.0.0.1:8090
BACKGROUND_REMOVAL_TIMEOUT_MS=90000
BACKGROUND_REMOVAL_MAX_IMAGE_BYTES=50000000
```

## Warm pool and operational endpoints

- `POST /warmup` loads the standard and detail sessions before staff traffic.
- `GET /metrics` returns aggregate processing, review, category, model and duplicate-cache statistics; it does not return images.
- `POST /review-feedback` records category/failure counters without storing the photo.

Persistent model sessions, a model-cache volume, bounded concurrency, duplicate caching and exponential retry are used to reduce latency and avoid worker overload.

## Privacy, pixels and model licensing

Model weights are intentionally not bundled in the source ZIP. `rembg` downloads configured weights to its model cache. Confirm the exact weight/version license before commercial deployment and preserve that evidence.

Opaque product pixels are preserved by the default workflow. Lighting normalization is explicit opt-in. Edge decontamination only adjusts partially transparent boundary pixels. Paid provider fallback remains disabled by default with a $0 budget.

## Benchmark

Use `release/phase91.5/benchmark-template.csv` and:

```bash
npm run benchmark:phase91.5 -- path/to/benchmark.csv --write release/phase91.5/latest-category-parity-report.json
```

A result can support a comparable-quality statement only for the tested workload; it does not certify universal parity with PhotoRoom, remove.bg, Removal.AI, or any other provider.
