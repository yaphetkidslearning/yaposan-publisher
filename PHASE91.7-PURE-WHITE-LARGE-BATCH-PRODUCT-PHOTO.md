# Phase 91.7 — Pure White + Large Batch Product Photo

91.7 adds a strict pure-white catalog workflow and a large batch UX.

## Pure white
The Product Photo Studio defaults to white background and enables **Pure White Guarantee**. Strict mode composites to exact `#FFFFFF`, disables shadows, audits every true-background pixel, and sends any non-compliant result to REVIEW.

## Large batches
Users can select up to **500 photos in one batch**, process them through a bounded worker queue, retry review/failed images at max quality, and download completed images as one ZIP. Worker options are 4/6/8/12; bounded concurrency protects the self-hosted model service from memory/GPU exhaustion.

This intentionally does not run 500 AI inferences simultaneously. It accepts the 500-photo batch at once and drains it in controlled parallel groups, which is the safer production pattern for a 50-user organization.

## Cost
Paid per-image API fallback remains disabled by default with a $0 monthly budget.
