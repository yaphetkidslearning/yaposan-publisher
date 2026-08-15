# Phase 71 — Commercial Billing and Real AI Platform

Phase 71 combines Phases 70–71 on top of the Phase 69 cloud backend.

## Billing
- Four plan catalog: Free, Creator ($9.99), Professional ($19.99), Business ($39.99)
- Stripe Checkout, Customer Portal and signed webhook support
- Subscription synchronization into the persistent database
- Server-side feature entitlements, storage limits, AI credits and seat limits
- Automatic fallback to Free when a subscription is inactive

## AI gateway
- Server-only provider credentials
- OpenAI-compatible primary and fallback providers
- Writing, translation, OCR, image, background removal, upscale and design tasks
- Input moderation, retries, provider fallback and deterministic usage accounting
- Per-plan monthly AI-credit enforcement
- Persistent AI job history, attempts, failures, result checksums and usage

Production use requires valid Stripe price IDs, webhook secret and AI-provider credentials in environment variables.
