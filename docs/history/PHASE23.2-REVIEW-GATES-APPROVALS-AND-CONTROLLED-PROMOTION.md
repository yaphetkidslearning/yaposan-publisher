# Phase 23.2 — Review Gates, Approvals and Controlled Promotion

Phase 23.2 extends the real Phase 23 collaboration workspace with production release governance.

## Production functionality

- Snapshot-bound reviewer approvals and change requests
- Designer, editor, legal, brand and owner review roles
- Channel-specific release policies
- Release-readiness scoring and explicit blockers
- Immutable-version requirements
- Certification requirements for staging and production
- Controlled development → review → staging → production promotion
- Promotion audit history with branch hash and approval evidence
- Automatic invalidation of stale approvals after project changes
- Backward migration from Phase 23.0 and 23.1 workspaces
- Editor integration in Review → Phase 23 Version Control → Approvals & Promotion

## Verification

```powershell
npm install
npx tsc --noEmit
npm run test:phase23.0
npm run test:phase23.1
npm run test:phase23.2
npm run verify:phase23.2
```
