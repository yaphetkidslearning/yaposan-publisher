# Phase 89 Incident Response Runbook

## Trigger conditions

- API or website unavailable
- Database, Redis, storage, or export worker unavailable
- Stripe webhook failure spike
- Email-delivery failures
- Backup failure
- AI cost anomaly
- Storage threshold exceeded
- Error-rate or latency spike

## Response

1. Declare incident severity and assign an incident lead.
2. Preserve logs and deployment identifiers.
3. Disable risky operations with feature flags where available.
4. Roll back to the last verified deployment when required.
5. Communicate status and mitigation progress.
6. Verify recovery with synthetic checks and real user journeys.
7. Produce a post-incident review with corrective actions.
