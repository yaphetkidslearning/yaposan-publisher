# Yaposan Publisher v1.0.0 RC7

## RC Step 7 — Production Identity, Licensing, and Commercial Readiness

RC7 adds enforceable commercial controls that can be validated locally without pretending live identity or payment providers are connected.

## Completed

- Added HMAC-SHA256 signed organization licenses.
- Added license plan, seat, device, issue, expiration, and grace-period claims.
- Added constant-time license signature validation and tamper detection.
- Added device activation-limit checks with existing-device reactivation support.
- Added production validation for a minimum 32-character `LICENSE_SIGNING_SECRET`.
- Added license status API using `x-license-token`.
- Added commercial readiness diagnostics for Stripe, plan Price IDs, Resend, Microsoft, Google, Apple, generic OIDC, SAML, and MFA issuer configuration.
- Added administrator-only commercial diagnostics API.
- Replaced client-supplied Stripe Price IDs with server-controlled plan-to-price mapping.
- Added checkout quantity limits and HTTPS redirect validation.
- Required an organization billing customer before checkout.
- Added Stripe webhook timestamp tolerance to reject replayed or stale webhook signatures.
- Updated package, health endpoint, server label, and audit scripts to `1.0.0-rc.7`.

## Validation

Combined RC2–RC7 and production-backend regression:

- 49 tests passed
- 0 tests failed

The validated set covers authorization, storage signing, distributed collaboration, durable workers, artifact publication, media rendering, identity foundations, billing entitlements, launch security, signed licensing, device limits, Stripe plan mapping, checkout validation, webhook replay protection, and commercial diagnostics.

## Environment variables added or enforced

- `LICENSE_SIGNING_SECRET`
- `REQUIRE_EMAIL_VERIFICATION`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`
- `OIDC_ISSUER`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `SAML_ENTRY_POINT`
- `SAML_ISSUER`
- `SAML_CERT`
- `MFA_ISSUER`

## Credential-dependent work still requiring hosted validation

- Live Microsoft, Google, Apple, OIDC, and SAML login callbacks.
- Email verification and password-reset delivery through a verified Resend domain.
- TOTP enrollment and recovery-code lifecycle through the production UI.
- Live Stripe Checkout, Billing Portal, webhook delivery, trials, failed payments, upgrades, and downgrades.
- Persistent license activation/device records in PostgreSQL for multi-instance deployment.
- Real production secrets, domains, callback URLs, and provider-console configuration.
- Full dependency installation, TypeScript validation, and Expo production web build where npm registry access is available.

RC Step 8 was not started.
