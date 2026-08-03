# Yaposan Publisher v1.0.0 RC2 — Production Backend and Infrastructure Hardening

## Completed in RC2
- Added centralized workspace/project authorization checks for owners, organization members, editors, and read-only viewers.
- Protected project creation, asset upload planning/completion, collaboration reads/writes, and export creation with membership checks.
- Restricted export job reads, cancellation, and retries to the user who created the job.
- Removed signed-in-user access to worker mutation routes.
- Added constant-time `X-Worker-Token` authentication for export worker claim and update routes.
- Added administrator allow-list recognition and a protected `/api/v1/admin/status` endpoint.
- Added real Cloudflare R2/S3-compatible AWS Signature Version 4 presigned PUT URLs.
- Added direct R2 upload, download, and delete operations using signed requests.
- Added `EXPORT_WORKER_TOKEN` and `R2_SIGNING_REGION` environment settings.
- Updated health/version metadata and package version to `1.0.0-rc.2`.
- Updated the outdated Phase 71 entitlement regression test to match the unified RC pricing and Enterprise seat limit.

## Validation performed
The following focused backend suites passed locally without installed third-party packages:

- RC2 production backend hardening
- Phase 69 identity, PostgreSQL adapter contract, and storage
- Phase 71 billing and AI platform
- Phase 73 collaboration and export regression
- Phase 75 security and launch controls

Result: **20 passed, 0 failed**.

## Production safeguards
Production configuration now fails readiness when:
- Export workers are enabled without `EXPORT_WORKER_TOKEN`.
- Multi-instance production collaboration is configured with the in-memory driver instead of Redis.
- Required database, R2, Stripe, OpenAI, administrator, or session configuration is absent.

## Still requires credentials or hosted infrastructure
- PostgreSQL connectivity, migrations, backups, and TLS verification against the real hosted database.
- Redis-backed distributed collaboration implementation and hosted Redis verification. The current collaboration engine remains valid for one local process only.
- Real Cloudflare R2 account credentials, bucket CORS policy, and end-to-end upload/download verification.
- Real Stripe Price IDs, checkout, customer portal, and webhook delivery verification.
- Real OpenAI API usage and production quota verification.
- Real Resend sending-domain verification.
- A deployed export worker process, renderer dependencies, durable locking, artifact publication, retries, and monitoring.

## Build environment limitation
The sandbox still cannot complete `npm ci`, so the complete TypeScript check and Expo web production export cannot be certified here. Run in CI or a workstation with npm registry access:

```bash
npm ci
npm run audit:rc2
```

RC2 is complete for the scoped backend authorization and object-storage hardening. Do not treat external services as live until their credentialed end-to-end checks pass.
