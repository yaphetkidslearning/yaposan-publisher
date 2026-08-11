# Production Certification Matrix

Allowed status values: `PASS`, `PASS WITH DOCUMENTED LIMITATION`, `BLOCKED`, `NOT APPLICABLE`.

| Area | Status | Evidence required |
| --- | --- | --- |
| Full Git-history secret scan | BLOCKED | Real checkout Gitleaks output |
| Typecheck/tests | BLOCKED | Real checkout command output |
| DNS/TLS/CORS | BLOCKED | Production probes/config evidence |
| Supply chain | BLOCKED | npm audit, lockfile, Dependabot, CodeQL, SBOM |
| Tenant isolation | BLOCKED | Route/API tests |
| Data lifecycle/privacy | BLOCKED | Deletion/retention/restore evidence |
| Upload security | BLOCKED | Adversarial upload tests |
| Webhooks | BLOCKED | Signature/idempotency/replay tests |
| Email | BLOCKED | Delivery + SPF/DKIM/DMARC evidence |
| Browser/platform | BLOCKED | Matrix results |
| Accessibility | BLOCKED | WCAG 2.2 AA evidence |
| Editor integrity | BLOCKED | Stress/recovery results |
| Session security | BLOCKED | Edge-case results |
| AI privacy/security | PASS WITH DOCUMENTED LIMITATION | Static protections exist; production provider policies remain deployment-specific |
| Observability/alerts | BLOCKED | Alert-delivery evidence |
| Graceful degradation | BLOCKED | Failure-injection evidence |
| Export worker/queue | BLOCKED | Worker recovery evidence |
| DB migrations | BLOCKED | Production-like migration drill |
| Backup/restore | BLOCKED | Restore evidence + RPO/RTO |
| Rollback/restart | BLOCKED | Non-production drill |
| API abuse controls | BLOCKED | Endpoint-specific rate-limit tests |
| Public sharing | BLOCKED | Authorization/indexing tests |
| Billing/credits | BLOCKED | End-to-end Stripe/credit evidence |
| Date/time/currency | BLOCKED | Boundary tests |
| Clean clone | BLOCKED | Clean-machine transcript |
| Repo governance | BLOCKED | GitHub settings evidence |
| Asset licensing/legal | BLOCKED | Completed audit/legal publication |
| SEO | BLOCKED | Live HTML/robots/sitemap/Search Console evidence |
| Reproducible release | BLOCKED | Final manifest |
| Launch runbook | PASS | Runbook committed |
| Production smoke automation | PASS WITH DOCUMENTED LIMITATION | Script committed; live execution required |
