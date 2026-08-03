# Yaposan Publisher v1.0.0 RC8

## RC Step 8 — Production Operations, Observability, and Deployment Safety

RC8 adds operational controls needed to deploy and supervise the API without claiming that external hosting has already been validated.

## Completed

- Added process-level request metrics with active request, method, status-class, error, average-duration, and maximum-duration counters.
- Added authenticated Prometheus-compatible `/metrics` output protected by `METRICS_TOKEN` using constant-time comparison.
- Added separate `/live`, `/health`, `/ready`, and `/release` endpoints.
- Replaced the previous optimistic readiness response with timed database checks and optional object-storage write/read/delete probes.
- Added deterministic release evidence with version, commit SHA, build ID, environment, configuration state, test totals, and SHA-256 evidence checksum.
- Added proxy-aware client address resolution that trusts `X-Forwarded-For` only when `TRUST_PROXY=true` and only accepts IP-shaped values.
- Added bounded request, readiness, and graceful-shutdown timeouts.
- Added graceful SIGTERM/SIGINT handling that stops accepting connections, drains the HTTP server, closes the database, and has a forced-shutdown deadline.
- Added HTTP server request, header, and keep-alive timeout configuration.
- Fixed numeric environment parsing so `loadCloudConfig(env)` reads the supplied environment rather than the parent process environment.
- Updated package, health, release, and server labels to `1.0.0-rc.8`.

## New environment variables

- `METRICS_TOKEN` — required in production and must contain at least 24 characters.
- `TRUST_PROXY` — set to `true` only behind a trusted reverse proxy or load balancer.
- `REQUEST_TIMEOUT_MS` — defaults to 30000; permitted range 1000–120000.
- `SHUTDOWN_TIMEOUT_MS` — defaults to 15000; permitted range 1000–120000.
- `READINESS_TIMEOUT_MS` — defaults to 5000; permitted range 250–30000.
- `READINESS_STORAGE_PROBE` — set to `true` to perform a real object-storage round trip on readiness probes.
- `GIT_COMMIT_SHA` — deployment commit identifier returned by `/release`.
- `BUILD_ID` — CI/CD build identifier returned by `/release`.
- `RELEASE_TESTS_PASSED` and `RELEASE_TESTS_FAILED` — optional release evidence totals.

## Validation

Combined RC2–RC8 and production-backend regression:

- 60 tests passed
- 0 tests failed

The RC8-specific suite validates metrics, Prometheus output, trusted-proxy behavior, constant-time metrics authentication, operation timeouts, active storage probes, degraded readiness, deterministic release evidence, production configuration bounds, and graceful shutdown behavior.

## Hosted validation still required

- Deploy behind the intended reverse proxy and verify forwarded IP behavior.
- Connect Prometheus or another scraper to the authenticated metrics endpoint.
- Configure alert rules for readiness failures, 5xx rate, request latency, worker lease recovery, and storage errors.
- Exercise SIGTERM draining with real load and long-running exports.
- Run active readiness probes against production PostgreSQL, Redis, and Cloudflare R2.
- Validate backup restoration, disaster-recovery runbooks, and regional failover.
- Run full dependency installation, TypeScript validation, and Expo production web build in an environment with npm registry access.

RC Step 9 was not started.
