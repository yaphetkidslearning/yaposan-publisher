# Phase 75 — Security, Infrastructure, and Final Launch Certification

Phase 75 combines Phases 74–75 and closes the foundational roadmap.

## Security hardening

- Strict HTTP security headers and production HSTS policy
- Explicit origin allow-listing
- Signed CSRF tokens for state-changing browser requests
- Strong password policy
- Upload MIME, extension, size, and SHA-256 checksum policy
- Sensitive log-field redaction
- Production secrets and configuration readiness checks
- Deterministic launch certification

## Production infrastructure

- Production Docker image for the API
- PostgreSQL, Redis, API, export-worker, and reverse-proxy deployment topology
- Health and readiness probes
- Resource limits and restart policies
- Backup, object versioning, restore drill, RPO, and RTO planning
- Environment template for production credentials
- CI validation workflow
- Structured observability and alerting configuration

## Important deployment note

The source package contains the production implementation and deployment configuration, but real deployment still requires the owner to supply valid domains, TLS certificates, PostgreSQL/Redis endpoints, object-storage credentials, Stripe credentials, AI-provider credentials, email credentials, and monitoring destinations.
