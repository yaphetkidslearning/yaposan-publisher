# Phase 90.11 - Final Production Certification, Open-Source Launch & Release Readiness

Phase 90.11 converts the remaining launch-readiness requirements into an auditable release gate. It does not claim that external systems have passed until evidence is collected from the real Git repository, GitHub, Render, DNS/TLS providers, production services, and browser/accessibility testing.

## Certification outcomes

Every gate records one of four outcomes:

- `PASS`
- `PASS WITH DOCUMENTED LIMITATION`
- `BLOCKED`
- `NOT APPLICABLE`

A public/production release is blocked while any launch-critical gate is `BLOCKED` or required evidence is missing.

## Phase 90.11 gates

1. DNS, TLS, HSTS, redirects, CORS, mixed-content and localhost-production-call checks.
2. Production environment-variable audit, including detection of server secrets exposed through `EXPO_PUBLIC_*`.
3. Supply-chain review: lockfile integrity, npm audit, Dependabot, CodeQL and SBOM generation.
4. Authentication plus authorization/tenant-isolation testing across projects, exports, billing, AI credits, organizations, assets and provider credentials.
5. Data lifecycle/privacy review: deletion, retention, backups, provider-key deletion and export-my-data behavior where supported.
6. File-upload security review for MIME/signature validation, size limits, path traversal, SVG/script content, archive bombs and storage isolation.
7. Webhook security: signatures, replay resistance, idempotency, duplicate/out-of-order deliveries and retry behavior.
8. Email production certification, including SPF/DKIM/DMARC and production-safe links.
9. Browser/platform matrix at 100% zoom, high-DPI, mobile, touch, keyboard and resize behavior.
10. WCAG 2.2 AA accessibility release gate.
11. Editor data-integrity stress testing: undo/redo, autosave, refresh, duplicate tabs, offline/online, large/corrupt documents and simultaneous editing.
12. Session/security edge cases: expiry, revocation, password reset, logout-all-devices, CSRF/cookie protections and brute-force controls.
13. AI privacy/content-boundary documentation and secret/prompt redaction requirements.
14. Observability certification for logs, request IDs, latency/errors, database/Redis/storage, AI cost, billing and workers.
15. Alert delivery certification, not dashboard-only monitoring.
16. Graceful degradation when AI, Redis, object storage or Stripe is unavailable.
17. Queue/worker certification, explicitly including export-worker startup, retries, stalled/poison jobs, duplicate execution, recovery and graceful shutdown.
18. Database migration certification with production-like upgrade/failure/compatibility tests.
19. Backup integrity and restore drills with documented RPO/RTO.
20. Deployment rollback drill in a non-production environment.
21. Restart/zero-downtime behavior for sessions, reservations, exports, payments, transactions and saves.
22. Whole-API rate limiting for authentication, uploads, exports, shares, invitations, search, billing and expensive operations.
23. Public-sharing security and indexing controls.
24. Billing/credit edge cases, including duplicate checkout, failed webhooks, refunds/disputes and account deletion.
25. Timezone/date/currency boundary tests.
26. Clean-clone open-source test using only committed documentation/example configuration.
27. Contributor security boundary and private vulnerability-reporting process.
28. Repository governance: protected `main`, required PR/CI, no force pushes, secret scanning/push protection, Dependabot and CodeQL.
29. License and third-party asset redistribution audit.
30. Legal/public-site baseline.
31. SEO production verification and Search Console recrawl evidence.
32. Reproducible release manifest with Git SHA, Node/npm, lockfile hash, deployment ID, migration version and build timestamp.
33. Feature inventory with `Implemented / Tested / Production Verified / Known Limitation` status.
34. Launch-day runbook and rollback criteria.
35. Safe post-launch smoke automation via `npm run verify:production`.

## Generated evidence

`npm run certify:phase90.11:evidence` refreshes the evidence templates in `release/phase90.11/`. Automated local facts may be marked `PASS`; external facts remain `BLOCKED` until explicitly verified.

## Required local gate

Run from the real Git checkout:

```powershell
cd C:\Users\dgebrekidan\Yaposan
gitleaks git . --config .gitleaks.toml
git check-ignore -v gitleaks-report.json
git check-ignore -v gitleaks-full-report.json
npm run typecheck
npm test
npm run verify:phase90.11
npm audit
npm run sbom:phase90.11
```

Then run the consolidated PowerShell gate:

```powershell
.\scripts\phase90.11-local-certification.ps1
```

## Production smoke verification

Set `YAPOSAN_PRODUCTION_URL` and optionally `YAPOSAN_API_URL`, then run:

```powershell
npm run verify:production
```

The smoke verifier performs read-only checks only. It validates the home page title/canonical metadata, `robots.txt`, `sitemap.xml`, HTTPS and optional API health. It does not create or modify customer data.

## Public release rule

Do not make the repository public until the full-history Gitleaks scan is clean. Do not mark GitHub governance, deployment, Search Console, email/DNS, backup/restore, rollback, browser/accessibility or production-integration gates `PASS` without evidence from those systems.

## Phase 90.11 FULL CHECK correction

The Phase 90.11 release gate now includes a machine-readable **35-gate master certification** rather than only the smaller category summaries.

Run:

```powershell
npm run check:phase90.11:full
npm run certify:phase90.11:evidence
```

The authoritative source-readiness result is `release/phase90.11/full-certification.json`. It contains one entry for every gate numbered 01 through 35 above. `PASS WITH DOCUMENTED LIMITATION` means source/configuration readiness exists but live or manual evidence is still required. `BLOCKED` is never silently converted to `PASS`.

To make the command fail while any critical external or implementation gate is still blocked, run:

```powershell
npm run certify:phase90.11:full
```

This strict command is intended for the final release decision after GitHub, production infrastructure, browser/accessibility, backup/restore, rollback, worker/queue and third-party-license evidence has been collected.
