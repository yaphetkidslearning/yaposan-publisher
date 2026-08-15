# Phase 90.9 — Final Open-Source Security and Public Release Certification

Phase 90.9 closes the remaining security gaps identified after Phase 90.8. It is a release gate, not a claim that GitHub or production settings have already been changed.

## Security changes

- Narrows the Yaposan Gitleaks false-positive regex to `yaposan\.[A-Za-z0-9._-]+`.
- Keeps `gitleaks-report.json` and `gitleaks-full-report.json` ignored.
- Extends the Phase 90.7 verifier to require both default AI price variables.
- Binds provider API-key ciphertext to `organizationId + provider` with AES-256-GCM AAD.
- Stores an explicit provider credential `keyVersion` and supports controlled previous-key maps for rotation.
- Emits metadata-only provider security audit events for connect, update, delete, test, and key rotation.
- Strengthens provider endpoint filtering for private, loopback, link-local, CGNAT, multicast, documentation and special-use ranges.
- Pins the outbound provider request to the address that was validated by DNS resolution and rejects cross-origin redirects. This closes the Phase 90.8 DNS-rebinding/redirect gap for the built-in provider transport.
- Applies provider request timeouts and response-size limits before JSON is accepted.
- Adds hard prompt-byte, output-token, per-user concurrency, and per-organization concurrency limits.
- Adds Community AI hourly, daily, and monthly fairness controls while preserving the global monthly dollar ceiling.
- Retries only transient provider failures (429, 5xx, timeout/network conditions) with bounded exponential backoff; authentication and validation errors are not retried.
- Removes the frontend `EXPO_PUBLIC_REMOVE_BG_API_KEY` path. Provider/service API keys must never be shipped in the web bundle. Hosted image-AI credentials must remain server-side or be supplied through the encrypted provider vault.
- Adds adversarial Phase 90.9 tests for AAD mismatch, malformed/wrong-key ciphertext, credential audit events, special-use SSRF targets, timeout/oversized-response/redirect handling, prompt/token limits, concurrency, and retry classification.

## Open-source repository automation

Phase 90.9 adds `.github/workflows/open-source-security.yml` and `.github/dependabot.yml` so pull requests and `main` receive the same security checks. GitHub repository settings still need to be enabled manually: make the repository public only after the local full-history Gitleaks scan is clean, keep branch protection on `main`, require pull requests, enable GitHub secret scanning/push protection where available, and enable Dependabot security updates.

## Required local certification

Run from the real Git checkout, not from this ZIP:

```powershell
cd C:\Users\dgebrekidan\Yaposan
gitleaks git . --config .gitleaks.toml
git check-ignore -v gitleaks-report.json
git check-ignore -v gitleaks-full-report.json
npm run verify:phase90.9
```

Or, after Gitleaks is installed and available in `PATH`:

```powershell
npm run certify:phase90.9:local
```

A public-release certification requires all commands to pass with zero unreviewed Gitleaks findings. The packaged ZIP does not contain `.git`, so it cannot certify historical commits by itself.

## Production follow-up after public-repo certification

Redeploy the application, confirm the SEO title is live, verify `/robots.txt` and `/sitemap.xml`, request re-indexing in Google Search Console, then return to the production release checklist: export worker, save/cloud save/export/AI/credit billing, and the full release checklist.
