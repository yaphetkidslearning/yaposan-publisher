# Production Deployment Step 6 — Live Production Activation

This step provides the executable gate for activating Yaposan Publisher v1.0.0 in real provider accounts. It does not contain or simulate live credentials.

## Added
- Strict production secret and topology preflight validation.
- Hosted activation verification for web, liveness, health, readiness, release evidence, and protected metrics.
- Controlled API-first migration and service bring-up order.
- Provider secret ownership matrix.
- Login, email, AI, storage, export, billing, collaboration, and administrator launch checklist.
- Explicit rollback boundaries and evidence capture.

## Commands
- `npm run deploy:step6:preflight`
- `npm run deploy:step6:verify`
- `npm run deploy:step6:validate`

## Honest status
The package is ready to guide live activation, but no external account was modified and no hosted endpoint was certified in this environment.
