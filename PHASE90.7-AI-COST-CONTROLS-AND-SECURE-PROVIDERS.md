# Phase 90.7 — AI Cost Controls and Secure Providers

Phase 90.7 closes the production gaps identified after the Phase 90.6 prepaid-credit foundation while preserving the Phase 90.5 product contract: **Yaposan itself is free/open source; AI consumption is separate.**

## Audit findings closed in 90.7

Phase 90.6 had a working Stripe credit ledger, but three production boundaries were still explicit: hosted AI was not yet reserving/settling credits around each real provider request, Community AI did not yet have a shared monthly dollar ceiling, and BYO-provider credentials did not yet have encrypted server-side storage. Phase 90.7 implements all three.

The audit also found two practical integration gaps: the AI-credit UI attempted checkout without the authenticated API helper, and the provider manager listed fewer providers than the product screen promised. Both are corrected.

## AI access contract

- **Yaposan Local** — free, no provider/API charge.
- **Community AI** — free to the user while the shared deployment budget has capacity.
- **Use My AI Provider** — the user supplies a provider credential and pays that provider directly; Yaposan adds no subscription fee.
- **Yaposan AI Credits** — prepaid hosted-AI consumption; credits are reserved before provider spend and unused reservation is returned after settlement.

No Professional, Professional Plus, or Enterprise subscription is required to choose an AI access mode.

## Community AI hard ceiling

`AI_COMMUNITY_MONTHLY_BUDGET_USD` defaults to `50` and is enforced server-side across the deployment. Before a Community AI request reaches a cloud provider, Phase 90.7 reserves the estimated maximum provider cost. The reservation is settled to actual metered token cost after success and fully released after failure.

This means a spike in registered users cannot silently turn the community program into an unbounded cloud bill. When the shared budget is exhausted the server returns `COMMUNITY_AI_BUDGET_EXHAUSTED` before the provider request is made.

The account AI screen exposes remaining Community AI budget when the user is signed in.

## Hosted AI credit reservation and settlement

For `accessMode: "credits"`, the AI gateway calculates a maximum credit reservation from the task, input size, and requested maximum output tokens. The debit occurs before provider invocation. After the provider returns actual usage, Phase 90.7 settles the reservation to the real internal credit cost and refunds unused credits. If every provider attempt fails, the reservation is returned.

Settlement is idempotent by reservation metadata so repeated settlement cannot refund twice.

## Provider cost metering

Community-budget accounting uses token-based provider-cost estimates configured with:

- `AI_DEFAULT_INPUT_USD_PER_MILLION_TOKENS`
- `AI_DEFAULT_OUTPUT_USD_PER_MILLION_TOKENS`

These values are deployment configuration, not hard-coded claims about any vendor's current public price. Production operators should set them to match the model/provider actually enabled by the deployment and update them when provider pricing changes.

## Secure BYO-provider vault

Phase 90.7 adds `ai_provider_credentials` with AES-256-GCM encryption. The server requires `AI_CREDENTIAL_ENCRYPTION_KEY` to be exactly 32 bytes (base64) or 64 hexadecimal characters before a cloud secret can be written or read.

The credential listing endpoint never returns ciphertext or plaintext keys; it returns only provider metadata and the last four characters for identification. Only organization owners/admins can create, update, or delete provider credentials.

Supported connection choices now match the Phase 90.5 UI contract:

- OpenAI
- Google Gemini
- Anthropic Claude
- Ollama
- LM Studio
- Custom provider

OpenAI, Ollama, LM Studio, and custom endpoints use an OpenAI-compatible chat-completions adapter. Gemini and Anthropic use provider-specific request shapes. Ollama and LM Studio can be connected without an API key.

## New authenticated APIs

- `GET /api/v1/ai/community-budget`
- `GET /api/v1/ai/providers/credentials`
- `PUT /api/v1/ai/providers/credentials`
- `DELETE /api/v1/ai/providers/credentials/:provider`

The existing `POST /api/v1/ai/generate` accepts `accessMode` values `community`, `credits`, or `provider`. For provider mode, pass the saved provider id in `provider`.

## Database additions

Phase 90.7 adds:

- `ai_community_transactions` — append-only reserve/settle/release accounting for the shared monthly Community AI budget.
- `ai_provider_credentials` — encrypted BYO-provider credentials scoped to an organization.

PostgreSQL migrations and the in-memory test adapter both include the new entities.

## UI corrections

- AI-credit checkout now uses the authenticated API helper rather than an anonymous request.
- Current prepaid credit balance is shown on the AI-access screen.
- Community AI shows the shared monthly budget state.
- Provider Manager now includes OpenAI, Gemini, Anthropic, Ollama, LM Studio, and Custom Provider.
- Provider credentials can be connected/disconnected from the UI and are stored encrypted on the server.

## Environment configuration

Add production values for:

```text
AI_COMMUNITY_MONTHLY_BUDGET_USD=50
AI_DEFAULT_INPUT_USD_PER_MILLION_TOKENS=...
AI_DEFAULT_OUTPUT_USD_PER_MILLION_TOKENS=...
AI_CREDENTIAL_ENCRYPTION_KEY=...
```

The credit-pack Stripe variables from Phase 90.6 remain required for Yaposan AI Credits.

## Verification

Run:

```bash
npm run test:phase90.7
npm run verify:phase90.7
```

`verify:phase90.7` runs the project TypeScript check followed by the Phase 90.5, 90.6, and 90.7 regression tests.

The Phase 90.7 test suite verifies the shared monthly budget ceiling, reservation settlement, credit pre-spend/refund behavior, encrypted provider-key storage, safe credential listing, decryption, and deletion.

## Production note

Do not place `AI_CREDENTIAL_ENCRYPTION_KEY` or provider API keys in source control. Configure them through the deployment secret manager. Rotate the vault key only with an explicit credential re-encryption migration; replacing the key without migration makes previously stored credentials unreadable.
