# Phase 80 — Paid Subscriptions, Billing, and Commercial Completion

Phase 80 completes the production billing path on top of Phase 79.

## Included
- Real Stripe Checkout for Professional, Professional Plus, and Enterprise.
- Automatic Stripe customer creation at first checkout.
- Server-owned billing portal creation; the browser cannot supply another customer ID.
- Webhook synchronization for Checkout completion and subscription created, updated, and deleted events.
- Real account billing status and current-plan display.
- Stripe Customer Portal for payment methods, invoices, upgrades, downgrades, and cancellation.
- Server-side price mapping through STRIPE_PRICE_CREATOR, STRIPE_PRICE_PRO, and STRIPE_PRICE_BUSINESS.
- Subscription entitlements continue to control quotas and premium features.
- Safer error responses for configuration, checkout, quota, and authorization failures.
- Phase 80 billing regression tests.

## Provider setup still required
The application needs valid Stripe products/prices, live or test API keys, a webhook signing secret, and the three Stripe Price IDs in Render. Stripe controls payment-card collection and invoice documents.
