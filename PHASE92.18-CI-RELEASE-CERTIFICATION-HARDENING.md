# Phase 92.18 — CI Release Certification Hardening

Phase 92.18 closes the remaining GitHub CI blockers observed after 92.17.

## Fixes

- RC12 no longer requires the obsolete package version `1.0.0`; it validates synchronized phase metadata while preserving the separate server/desktop 1.0.0 release label.
- ESLint and Expo ESLint configuration are declared as project development dependencies so clean CI runners can execute `expo lint`.
- CodeQL receives the `actions: read` permission required to inspect workflow-run metadata, alongside read-only contents and security-events upload permissions.
- Phase 92.17 AI gateway hardening remains intact.

## Final gate

```text
npm run verify:phase92.18
```
