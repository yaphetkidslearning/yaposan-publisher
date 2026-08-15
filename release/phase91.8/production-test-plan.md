# Phase 91.8 production proof

The release gate validates architecture and regression behavior. Production certification still requires a real deployment test.

Required proof:

1. Submit one 500-photo batch.
2. Close and reopen the browser after the batch starts; verify the job remains visible and progresses.
3. Restart a worker during processing; verify stale processing items return to the queue after lease expiry.
4. Verify only review/failed items are retried.
5. Download the server-built ZIP and verify item count and safe unique names.
6. For certified pure-white PNG/lossless WebP outputs, verify the post-export audit reports 100% exact `#FFFFFF` outside the foreground matte and zero non-white background pixels.
7. Include white-on-white products and confirm the detail route is forced.
8. Run multiple users concurrently and confirm per-user/per-organization active-batch limits and bounded worker concurrency.
9. Confirm no source image is lost and no paid per-image API spend occurs.
