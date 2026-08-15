# Phase 92.17 - CI AI Gateway Hardening

Phase 92.17 repairs the Phase 71 CI provider-fallback regression without weakening AI endpoint security.

- Replaces the obsolete `globalThis.fetch` mock with a deterministic loopback HTTP test server.
- Uses the explicitly local `ollama` / `lmstudio` provider modes for loopback test traffic.
- Disables retries only inside the fallback test so provider ordering is deterministic and fast.
- Normalizes malformed provider URLs to `AI_PROVIDER_ENDPOINT_INVALID` instead of leaking Node's `ERR_INVALID_URL`.
- Adds `test:phase92.17` and `verify:phase92.17` release gates.
