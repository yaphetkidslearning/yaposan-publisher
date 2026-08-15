# Phase 91.0 — Production Product Photo Engine

Phase 91.0 turns the 90.19 foundation into a organization-ready production workflow while preserving a zero paid-per-image API default.

## Added

- Two-path self-hosted inference: standard and high-detail models.
- Automatic image-difficulty routing.
- Alpha-matting refinement on the high-detail path.
- Cutout sanity scoring with PASS/REVIEW classification.
- Automatic max-quality retry when the standard path looks suspicious.
- Organization marketplace preset: white or transparent output, square canvas, centered product, consistent padding.
- Batch selection up to 500 photos and three-at-a-time processing in the web UI.
- Review/failed queue and explicit max-quality retry.
- Manual Keep/Remove web touch-up that restores original pixels or erases background; it does not generate replacement product pixels.
- Per-image model, retry, score and processing-time visibility.
- Cost firewall: paid API fallback remains disabled with a $0 default budget and no auto-overage.
- 200–500-image blind benchmark requirements plus staged 2 → 5 → 10 → 50 employee rollout.

## Quality claim

91.0 is engineered toward competitive product-photo quality, but it is **not pre-certified as equal to PhotoRoom or Removal.AI**. That claim requires representative organization evidence meeting `release/phase91.0/quality-targets.json`.

## Production service

```bash
cd services/background-removal
docker compose up --build
```

Set the Yaposan API environment:

```text
BACKGROUND_REMOVAL_URL=http://127.0.0.1:8090
BACKGROUND_REMOVAL_TIMEOUT_MS=90000
BACKGROUND_REMOVAL_MAX_IMAGE_BYTES=25000000
```

The service caches model weights outside the source ZIP. Confirm the exact model-weight license/version before commercial deployment.

## Final local verification

```bash
npm ci
npm run verify:phase91.0
```

Then perform the real organization benchmark before a 50-user rollout.
