# Production Burn-In Acceptance Criteria

The production release is accepted only after a continuous observation window with no critical incident.

## Minimum gates

- Public web, API liveness, readiness, and release endpoints remain available.
- Reported release version remains `1.0.0` for every sample.
- Availability is at least 99.9% during the formal 24-hour window.
- API p95 latency is below 1,500 ms and no sustained 5xx increase occurs.
- PostgreSQL and Redis remain healthy with no connection exhaustion.
- Export jobs do not remain leased or processing beyond their configured lease and timeout.
- Stripe webhook failures, R2 publication failures, and Resend delivery failures are investigated and reconciled.
- No Sev-1 or unresolved Sev-2 incident is open.

A local structural package cannot certify these live gates. The generated JSON burn-in report is evidence only after it runs against deployed production endpoints.
