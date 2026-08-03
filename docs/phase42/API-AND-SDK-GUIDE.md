# API and SDK Guide

Use versioned `/api/v1` endpoints with authenticated sessions or scoped API keys. Send a correlation ID when available. Webhook consumers must validate signatures, reject stale timestamps and process idempotently. Plugins must declare permissions, isolate untrusted execution, observe API quotas and never access secrets directly.
