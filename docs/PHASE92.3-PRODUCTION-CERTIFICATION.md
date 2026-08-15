# Phase 92.3 — Full Runtime and Production Certification

Phase 92.3 closes the gap between repository/community readiness and runtime production evidence.

## 1. Reproducible source/CI certification

From a clean checkout on Node 22:

```bash
npm ci --ignore-scripts
npm run certify:production
```

`certify:production` is the source/runtime gate. It runs TypeScript, lint, the critical creation/runtime regression chain from 91.11 through 91.15, Phase 92 community/public-release tests, dependency-license validation, Phase 92.3 structural checks, and a production web export.

A passing source/runtime gate **does not claim** that external production services are healthy. It proves the committed source passes the checks that can be executed without private production credentials.

## 2. Live production certification

After deployment, with production endpoints configured:

```bash
YAPOSAN_PRODUCTION_URL=https://yaposan.com \
YAPOSAN_API_URL=https://api.yaposan.com \
npm run certify:production:live
```

The live command reruns the source/runtime certification and then performs read-only HTTPS production smoke checks.

## 3. External service evidence still required for release-owner sign-off

The following cannot be truthfully certified from a source ZIP alone and must have dated evidence from the real production environment:

- PostgreSQL migration/connectivity and restore evidence.
- Redis/Valkey connectivity and multi-instance collaboration behavior.
- R2 upload, download, signed URL, and worker publication behavior.
- Stripe live checkout, webhook synchronization, cancellation, and customer portal behavior.
- OpenAI production key/quota/error-path behavior.
- Backup creation, checksum verification, and restore drill.
- TLS for public application/API domains.
- Monitoring, alerting, rollback rehearsal, and incident-response contacts.
- Published, approved legal policies and production support/security contacts.

## 4. Fixes included in 92.3

- Active release workflows now use deterministic `npm ci --ignore-scripts` instead of `npm install --ignore-scripts`.
- Current architecture/testing/install documentation uses `npm ci` for a committed lockfile.
- The storage configuration no longer advertises S3 or Azure as selectable drivers when the implementation supports local storage and R2 only; unsupported `STORAGE_DRIVER` values fail immediately with a clear error.
- Production certification is split into a source/CI gate and a live-environment gate to prevent a green repository check from being confused with production-service validation.

## Release rule

Do not label a build “fully live-certified” unless both the source/runtime gate is green and the external-service checklist has dated production evidence. Source-only certification may be labeled “92.3 source/runtime certified.”
