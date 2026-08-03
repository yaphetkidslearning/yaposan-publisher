# RC10 — Security and Performance Certification

Version: `1.0.0-rc.10`

## Completed

- Added origin-form request-target validation.
- Added encoded and decoded path-traversal rejection.
- Added invalid percent-encoding and null-byte rejection.
- Added configurable query-parameter limits.
- Added JSON depth, node-count, and string-length limits.
- Replaced the unbounded in-memory request counter with a bounded rate limiter.
- Added basic attack-signal screening for XSS, SQL injection, JNDI injection, and path traversal for security auditing utilities.
- Added file magic-byte verification for PNG, JPEG, PDF, and ZIP uploads.
- Added SHA-256 calculation during signature verification.
- Added performance-budget evaluation for p95 latency, peak memory, and output size.
- Added production configuration validation for all RC10 request and rate limits.
- Updated API and package version labels to `1.0.0-rc.10`.

## Environment configuration

- `MAX_REQUEST_BODY_BYTES`
- `MAX_JSON_DEPTH`
- `MAX_JSON_NODES`
- `MAX_QUERY_PARAMETERS`
- `RATE_LIMIT_PER_MINUTE`
- `RATE_LIMIT_MAX_ENTRIES`

## Validation evidence

The focused RC2–RC10 backend and launch regression suite completed:

- Tests: 77
- Passed: 77
- Failed: 0

The RC10-specific suite contains 11 tests covering request targets, JSON complexity, injection signals, file signatures, bounded rate limiting, performance budgets, and configuration validation.

## Important boundary

This is code-level security and performance hardening, not a claim that an independent penetration test has been performed. The following still require deployed infrastructure:

- Authenticated dynamic application security testing against a staging URL.
- Dependency vulnerability scanning after a successful dependency installation.
- Real SQL injection testing against PostgreSQL-backed routes.
- Distributed rate limiting across multiple API instances.
- Load and soak testing with representative projects and concurrent users.
- Memory leak profiling of the Expo web client and export workers.
- CDN, WAF, reverse-proxy, TLS, and denial-of-service testing.
- External security review and remediation verification.
