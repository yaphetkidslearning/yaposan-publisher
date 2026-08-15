# Phase 91.8 — Batch Reliability + Pure White Production

91.8 turns the Product Photo Studio batch workflow into a durable server workflow suitable for organizational use.

## Durable batch jobs
- 1–500 image jobs with unique IDs and idempotency keys.
- Images are uploaded one file at a time rather than placing the complete batch in one enormous JSON payload.
- Job metadata is persisted in the existing database job table; image bytes/results are stored in the configured object storage.
- A dedicated worker claims jobs with leases, updates progress after each bounded group, and recovers stale work after a worker interruption.
- Recent job history, queue depth, progress, ETA, retry of review/failed items, and server-created ZIP export are exposed through authenticated routes.
- Per-user and per-organization active-batch limits prevent a single user from monopolizing compute.
- Configurable retention cleanup removes input/output objects after the retention period.

## Exact white production
Certified pure-white mode is stricter than a visually white JPEG. It requires PNG or lossless WebP, disables shadows, composites to exact RGB(255,255,255), performs a pre-export audit, then decodes the encoded result and performs a second post-export audit. Any failure is sent to REVIEW.

JPEG remains available as Marketplace White but is not labeled mathematically exact-white certified because compression can alter RGB values.

White-on-white risk forces the detail model path so a white product against a white/light background is not auto-approved using only a fast mask.

## Cost
Paid per-image fallback remains disabled by default with a $0 monthly budget and no automatic overage.
