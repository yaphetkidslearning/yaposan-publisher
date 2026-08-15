# Phase 90.5 — Free/Open-Source AI Access Model

## Goal

Separate **Yaposan application access** from **AI consumption**. Yaposan remains free/open source; users choose how AI is funded.

## User-facing model

1. **Yaposan Local — Free**: supported local AI workflows with no cloud API cost.
2. **Community AI — Free · Limited**: Yaposan-sponsored cloud AI, subject to the shared monthly community budget and availability.
3. **Use My AI Provider — Pay provider directly**: connect OpenAI, Gemini, Anthropic, Ollama, LM Studio, or a custom provider. This is the recommended scalable path.
4. **Yaposan AI Credits — Pay as you go**: prepaid cloud-AI funding with $2, $5, and $10 purchase options.

## Changes

- Replaced the home-screen `Choose a plan` subscription cards with `Choose how you use AI`.
- Removed $9.99 / $19.99 / $39.99 subscription pricing from the current home-screen experience.
- Made **Use My AI Provider** visually recommended and linked it to the existing AI Provider Manager.
- Added explicit wording that Yaposan does not add a subscription fee when users bring their own provider.
- Reworded Community AI so availability depends on Yaposan's shared monthly community budget rather than a guaranteed per-user daily quota.
- Replaced the sidebar upgrade pitch with an AI-choice message.
- Replaced Account `Plans` / `Billing` subscription surfaces with `AI Access` / `AI Credits`.
- Added a Phase 90.5 AI Access Manager with $2 / $5 / $10 prepaid-credit presentation.

## Stripe migration boundary

Phase 90.5 changes the product model and user-facing application surfaces. Earlier Stripe subscription backend code is intentionally preserved for migration/history compatibility, but it is no longer presented as the normal Yaposan access model. Production one-time credit fulfillment requires deployment-specific Stripe price configuration and credit-wallet/webhook accounting before purchase buttons should charge real money. Phase 90.5 therefore does **not** fake successful credit purchases.

## Verification

Run:

```bash
npm run verify:phase90.5
```

The verification runs TypeScript checking plus the Phase 90.5 product-model regression tests.
