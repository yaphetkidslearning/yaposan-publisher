# Yaposan Publisher Operations Handbook

## Daily
Check `/live`, `/ready`, release version, error rate, p95 latency, export queue age, worker leases, Stripe webhook failures, email failures, R2 failures, PostgreSQL connections, Redis availability, and backup completion.

## Weekly
Review capacity trends, failed jobs, billing reconciliation, AI usage and cost, security events, administrator changes, dependency alerts, restore evidence, and TLS expiration.

## Change management
Every production change must identify the deployed commit and build, pass CI, include rollback instructions, preserve database compatibility, and be followed by smoke tests.

## Escalation
P1: data loss, security compromise, billing corruption, total outage. P2: major feature unavailable or severe degradation. P3: limited feature defect with workaround. P4: cosmetic or documentation issue.
