# Phase 90.8 — AI Financial Integrity, Provider Network Security, and Production Hardening

Phase 90.8 closes the production gaps identified after Phase 90.7 while preserving Yaposan's free/open-source product model.

## Financial integrity

AI-credit and Community AI reservations are serialized. PostgreSQL transactions now use one checked-out connection for `BEGIN`, every transactional query, `COMMIT`, and `ROLLBACK`. Advisory transaction locks protect organization credit balances and the shared monthly Community AI budget. The in-memory adapter serializes transactions for deterministic local/test behavior.

Credit and Community AI reservations are treated as hard maximums. If a provider unexpectedly reports usage above the reserved maximum, settlement records the overage in metadata but does not perform a post-provider debit or push Community AI accounting beyond the global reservation. This prevents negative surprise billing and preserves the configured monthly ceiling.

Stripe `charge.refunded` and `charge.dispute.created` events revoke previously purchased AI credits idempotently. Legacy Professional/Plus/Enterprise subscription endpoints and subscription webhook synchronization are disabled by default; migration-only deployments must explicitly set `YAPOSAN_ENABLE_LEGACY_SUBSCRIPTIONS=true`.

## Provider network security

Custom/cloud provider endpoints require HTTPS and are rejected when they resolve to loopback, link-local, RFC1918/private IPv4, or local/private IPv6 space. URLs containing embedded credentials are rejected. Ollama and LM Studio are the deliberate exception and are restricted to loopback addresses only.

Provider requests have a configurable timeout and maximum response size. This limits hanging connections, oversized response bodies, and common SSRF blast-radius patterns.

## Pricing and abuse controls

`AI_MODEL_PRICING_JSON` provides per-provider/per-model input and output token pricing. Community reservations choose the highest estimated cost among configured fallback providers before provider spend. Community AI also has per-user and per-organization hourly request limits in addition to the authoritative global monthly dollar ceiling.

## Provider credential operations

Encrypted credential payloads support a current encryption key plus previous keys during rotation. Administrators can re-encrypt stored credentials under the current key through the key-rotation API. A provider connection-test API validates endpoint policy and checks provider authentication/connectivity without returning secret material.

## Usage visibility

`GET /api/v1/ai/usage` provides organization-scoped credit transactions, Community AI budget/usage, and provider metadata. It does not return provider API keys.

## Configuration

- `AI_PROVIDER_TIMEOUT_MS=30000`
- `AI_PROVIDER_MAX_RESPONSE_BYTES=1048576`
- `AI_COMMUNITY_USER_REQUESTS_PER_HOUR=20`
- `AI_COMMUNITY_ORG_REQUESTS_PER_HOUR=100`
- `AI_MODEL_PRICING_JSON={}`
- `AI_CREDENTIAL_ENCRYPTION_KEY_PREVIOUS=`
- `YAPOSAN_ENABLE_LEGACY_SUBSCRIPTIONS=false`

## Verification

Run:

```powershell
npm run verify:phase90.8
```

The Phase 90.8 regression suite specifically checks concurrent budget enforcement, concurrent credit reservations, reservation overage behavior, SSRF policy, model-specific pricing, Stripe reversal idempotency, and Community budget settlement safety.
