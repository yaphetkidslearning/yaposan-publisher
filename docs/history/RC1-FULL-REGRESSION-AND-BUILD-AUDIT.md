# Yaposan Publisher v1.0.0 RC1 — Full Regression and Build Audit

## RC1 changes completed
- Aligned backend plan display names and entitlements with the frontend tiers: Free, Professional ($9.99), Professional Plus ($19.99), and Enterprise ($39.99).
- Added explicit environment configuration and production validation for PostgreSQL, Redis, Stripe, OpenAI, Cloudflare R2, Resend, administrator allow-list, collaboration mode, and export workers.
- Added a Resend HTTP email adapter that requires `RESEND_API_KEY` and `EMAIL_FROM`; no production email is simulated.
- Expanded `.env.example` and `.env.production.example` so local and hosted configuration are clearly separated.

## Validated locally
- ZIP extraction and source inventory completed.
- `package.json` and lockfile are present.
- Server routes exist for identity, projects, billing plans/entitlements, Stripe checkout/webhooks, AI gateway, collaboration, assets, and exports.
- PostgreSQL adapter activates when `DATABASE_URL` is set; otherwise the database falls back to the in-memory adapter for local development/tests.
- Frontend API services use `EXPO_PUBLIC_API_URL`, defaulting to `http://localhost:4100` only for local development.

## Requires credentials or hosting before production launch
- PostgreSQL: real `DATABASE_URL`, migrations, backups, TLS policy, and hosted connectivity.
- Redis: real `REDIS_URL`. Current collaboration presence/operations remain process-memory code; Redis-backed distributed collaboration is not implemented yet.
- Stripe: secret key, webhook secret, and three real Stripe Price IDs.
- OpenAI: real API key and production model/usage limits.
- Cloudflare R2: endpoint, access key, secret, bucket, CORS, and a signed-upload/provider implementation. The current cloud planner is not a complete R2 SDK implementation and must not be treated as production upload wiring.
- Resend: API key, verified sending domain, and `EMAIL_FROM`.
- Admin access: `ADMIN_EMAILS` is now required by production validation, but a complete admin authorization middleware/dashboard audit is still required.
- Exports/workers: hosted worker process, durable queue/locking, renderer dependencies, object storage output, retries, and monitoring.

## Build/test environment limitation
Dependency installation could not be completed in this sandbox because the configured package registry returned 404 for `@types/pg`, while direct public npm access was unavailable due DNS restrictions. Therefore TypeScript, the complete test suite, and Expo production export could not be truthfully certified in this environment. Run the commands below in CI or a workstation with npm registry access:

```bash
npm ci
npm run typecheck
npm run test:all
npm run build:web
```

RC Step 1 is improved and packaged, but final production validation remains blocked until those commands pass with dependencies installed and the listed external services are configured.
