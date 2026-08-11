# AI Privacy and Content Boundaries

Yaposan itself remains free/open source. AI use is a separate consumption choice: local AI, limited Community AI, bring-your-own-provider, or prepaid Yaposan-hosted AI credits.

Provider credentials are server-side secrets and must never be embedded in frontend bundles or committed to source control. BYO credentials are stored encrypted on the server. Logs must redact authorization headers, API keys, credential ciphertext, access/refresh tokens, passwords, payment secrets and complete sensitive prompts by default.

Before a remote AI request is sent, the product should make clear that relevant user content may leave the Yaposan deployment and be processed by the selected provider. Deployments should document provider retention/training policies separately because those policies are controlled by the provider and can change. Local AI should remain available when configured without sending document content to a remote provider.

Sensitive-document workflows should be able to disable remote AI at the organization/project level. Community AI is subject to the shared server-side budget and fairness limits and may be unavailable after those limits are reached.
