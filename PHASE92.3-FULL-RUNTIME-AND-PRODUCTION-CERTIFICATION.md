# Phase 92.3 — Full Runtime & Production Certification

**Goal:** make production-readiness claims precise, reproducible, and harder to overstate.

### Added
- Consolidated `certify:production` / `certify:production:ci` gate.
- Separate `certify:production:live` gate for deployed HTTPS smoke verification.
- Phase 92.3 regression tests and structural verifier.
- Production-certification evidence guide at `docs/PHASE92.3-PRODUCTION-CERTIFICATION.md`.

### Fixed
- Deterministic dependency installation in active release CI (`npm ci --ignore-scripts`).
- Current contributor/developer install guidance updated from `npm install` to `npm ci` where the committed lockfile is authoritative.
- Unsupported S3/Azure storage drivers removed from the public server configuration contract; local and R2 are the supported values.

### Certification
```bash
npm ci --ignore-scripts
npm run verify:phase92.3
```

For deployed production smoke verification, configure the production URLs and run:

```bash
npm run certify:production:live
```
