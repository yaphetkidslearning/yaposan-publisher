# Phase 90.6 — AI Credits and Provider Payment Foundation

Phase 90.6 completes the missing payment foundation behind Phase 90.5's free/open-source AI access model.

## Product contract

Yaposan core application access remains free. AI consumption is separate: local AI has no API charge; Community AI is budget-limited; BYO-provider users pay their provider directly; Yaposan-hosted cloud AI can be prepaid with one-time AI credit purchases. No Professional, Professional Plus, or Enterprise subscription is required for normal Yaposan functionality.

## Added in 90.6

- Durable append-only `ai_credit_transactions` ledger for purchases, usage, refunds/adjustments.
- Idempotent Stripe webhook fulfillment keyed by Stripe event/session IDs.
- One-time Stripe Checkout (`mode=payment`) for $2, $5, and $10 packs.
- Server endpoints for pack discovery, current balance, and checkout creation.
- Origin validation on checkout return URLs.
- Pre-spend balance enforcement helper so hosted AI cannot spend beyond prepaid credits.
- PostgreSQL migration and in-memory adapter support.
- Environment variables for three Stripe one-time Price IDs.
- Account UI credit-pack buttons now start checkout rather than showing a placeholder-only message.
- Automated Phase 90.6 tests and verification command.

## Credit packs

- Small — $2 — 200 credits
- Standard — $5 — 550 credits
- More — $10 — 1,200 credits

Credits are an internal hosted-AI usage unit, not a cash balance. Refund policy and final per-model credit pricing should be published before production sales.

## Deployment requirements

Create three one-time Stripe Prices and set `STRIPE_PRICE_AI_CREDITS_SMALL`, `STRIPE_PRICE_AI_CREDITS_STANDARD`, and `STRIPE_PRICE_AI_CREDITS_MORE`. Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` server-side. Configure Stripe to send `checkout.session.completed` to `/api/v1/webhooks/stripe`.

## Security/accounting guarantees

Credit fulfillment requires a verified Stripe webhook and `payment_status=paid`. Duplicate webhook delivery does not double-credit. Usage debits are ledger entries and reject insufficient balances. No API keys are added to source control.

## Remaining production integration boundary

The ledger and checkout foundation are production-shaped, but each Yaposan-hosted AI model must explicitly call `spendCredits` using a documented per-request cost before that model is enabled for paid hosted use. Community AI also needs the deployment's shared monthly budget gate. BYO-provider secret storage should use platform secure storage/server-side encrypted credentials rather than source files.

## Verification

Run `npm run verify:phase90.6`.
