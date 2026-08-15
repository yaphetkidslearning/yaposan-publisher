# Phase 91.5 — Advanced Product Photo Parity

Phase 91.5 hardens Yaposan's self-hosted Product Photo Engine toward commercial background-removal quality for real catalog workloads without silently routing images to paid per-image providers.

## Added

- rembg alpha-matting candidates with a softer alternate matte for difficult edges
- semi-transparent alpha preservation and conservative thin-structure recovery
- edge color decontamination to reduce background halos/color spill
- hole-preservation diagnostics and fragmentation checks
- conservative natural-shadow extraction for non-transparent output before layout transforms
- foreground bounding box, center, occupancy and geometry metadata
- deterministic catalog layout with target product occupancy and consistent vertical placement
- optional, explicit lighting normalization (off by default to preserve product pixels)
- white-on-white, black-on-black, low-contrast and color-spill risk detection
- partial-product / image-border review flagging
- up to three candidate strategies and category-aware candidate scoring
- automatic model/strategy failover and disagreement review
- category hints for hard goods, footwear, apparel, furniture, thin structures, hair/fur, glass/transparent, jewelry and general merchandise
- full-resolution staged processing up to the configured 50 MP cap
- PNG, lossless WebP and JPEG exports
- batch consistency metric in the Product Photo Studio
- duplicate-result cache keyed by image plus processing settings
- exponential retry for transient model/GPU failures
- persistent model sessions, warmup endpoint and concurrency semaphore
- GPU-capable rembg deployment path with CPU-compatible fallback deployment
- production `/metrics` endpoint and privacy-safe `/review-feedback` loop
- category-by-category competitive benchmark policy and evaluator

## Safety and cost boundary

The default paid-provider budget remains $0 and automatic overage remains disabled. Product pixels are preserved by default. Lighting normalization is an explicit opt-in and is not used by the default marketplace workflow.

## Claim boundary

This phase does not self-certify universal parity with PhotoRoom, remove.bg, Removal.AI, or another commercial system. Comparable quality may only be claimed for a specifically tested workload after a representative blind benchmark passes the 91.5 category policy.
