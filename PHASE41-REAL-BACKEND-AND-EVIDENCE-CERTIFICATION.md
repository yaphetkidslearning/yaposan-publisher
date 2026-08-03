# Phase 41 — Real Backend Foundation and Evidence Certification

Phase 41 replaces the previously empty backend and application service files with an executable TypeScript foundation.

## Implemented in this package

- Node HTTP API server with versioned routes, correlation IDs, structured errors, payload limits, security headers and rate limiting.
- Registration and login foundation using salted `scrypt` password hashing and signed expiring session tokens.
- Typed database schema for users, organizations, memberships, workspaces, projects, assets, versions, subscriptions, audit events and jobs.
- Transaction-capable database adapter and migrations, with an in-memory adapter for local development and testing.
- Project create/list endpoints and project-version creation.
- Secure AI provider proxy requiring server-side provider URL and API key.
- Stripe REST integration for customers, Checkout, billing portal, cancellation and cryptographic webhook verification.
- Background-job records for export, AI, image, video and notification work.
- Application cloud, project, payment, export and integration service clients.
- Health and readiness endpoints.
- Evidence-backed Phase 41 controls. A control cannot be certified from a status toggle alone.

## Required production configuration

Set `SESSION_SECRET`, `AI_PROVIDER_URL`, `AI_PROVIDER_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `EXPO_PUBLIC_API_URL`. Replace `InMemoryDatabase` with a persistent adapter for PostgreSQL or another approved production database. Deploy behind TLS and an approved reverse proxy.

## Honest production boundary

This package provides working local code and production integration contracts. It does not include third-party credentials, a deployed database, a live Stripe account, a live AI account, DNS, TLS certificates, cloud object storage, Kubernetes infrastructure or signed installers. Those require deployment-specific credentials and infrastructure and must be proven using the Phase 41 evidence controls.
