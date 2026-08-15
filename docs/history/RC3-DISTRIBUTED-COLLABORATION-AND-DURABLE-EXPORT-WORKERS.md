# Yaposan Publisher v1.0.0 RC3 — Distributed Collaboration and Durable Export Workers

## Completed in RC3
- Replaced process-global collaboration maps with a collaboration-store abstraction.
- Retained an isolated in-memory store for local single-process development and tests.
- Added a production Redis store for shared presence, operations, comments, and approvals.
- Added a dependency-free Redis/Redis-TLS command client supporting authenticated `redis://` and `rediss://` connections.
- Added expiring presence sessions and stale-presence cleanup.
- Added ownership enforcement for collaboration session updates.
- Added missing project-write authorization before resolving comments.
- Wrapped project revision updates, version insertion, and collaboration operation creation in one database transaction.
- Added durable export worker identity, lease expiration, heartbeat timestamps, and stale-job recovery.
- Added PostgreSQL `FOR UPDATE SKIP LOCKED` atomic job claiming for safe multi-worker deployments.
- Added PostgreSQL job lease columns and claim index through idempotent migrations.
- Added worker lease mismatch protection so another worker cannot complete a claimed job.
- Added `EXPORT_WORKER_ID` and `EXPORT_JOB_LEASE_SECONDS` production settings.
- Updated the package version to `1.0.0-rc.3`.

## Validation performed
Focused RC1-RC3 backend regression suites passed locally:

- Phase 69 cloud backend
- Phase 71 billing and AI platform
- Phase 73 collaboration and export platform
- Phase 75 security and launch certification
- RC2 backend authorization and R2 hardening
- RC3 distributed collaboration and export worker leasing

Result: **23 passed, 0 failed**.

## Works locally without external credentials
- In-memory collaboration for one API process.
- In-memory export queue and lease behavior for development/tests.
- Collaboration authorization, revision conflict handling, comments, approvals, and presence logic.
- Export job claiming, heartbeat, lease enforcement, cancellation, retry, and stale recovery logic.

## Requires real hosting or credentials
- Redis must be reachable through `REDIS_URL` to validate multi-instance shared collaboration end to end.
- PostgreSQL must be reachable to execute the new lease migration and verify concurrent `SKIP LOCKED` claims under load.
- Export workers still require real renderer binaries and artifact publication to R2 for end-to-end document/media output.
- Worker replicas need unique `EXPORT_WORKER_ID` values and operational monitoring.

## Build environment limitation
This sandbox does not contain installed npm dependencies and cannot access the npm registry. The complete TypeScript and Expo web production build must still be run in CI or a workstation with registry access:

```bash
npm ci
npm run audit:rc3
```

RC Step 3 is complete for distributed collaboration state and durable multi-worker export queue control. External Redis, PostgreSQL concurrency, renderer, and R2 publication checks must not be marked live until credentialed deployment validation passes.
