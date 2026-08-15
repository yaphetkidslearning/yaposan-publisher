# Phase 90.12 - Certification Repair and Full Release Gate Fixes

Phase 90.12 repairs packaging/certification defects discovered while running Phase 90.11 on the real Windows checkout. It does not convert external production gates to PASS without evidence.

## Corrections

1. Adds a top-level `npm test` command that aggregates the Phase 90.5, 90.6, 90.7, 90.8, 90.9, 90.11 and 90.12 release-security suites.
2. Preserves the canonical Phase 90.11 certification document at the exact root path expected by the verifier.
3. Bundles a second canonical copy under `release/phase90.12/` and adds `scripts/ensure-phase90.11-canonical-doc.mjs` so a missing root document can be repaired deterministically instead of failing with a confusing packaging error.
4. Makes `check:phase90.11`, `check:phase90.12` and `verify:phase90.12` run the canonical-document repair first.
5. Keeps the Phase 90.11 35-gate model strict. Email, browser matrix, accessibility, graceful degradation, backup/restore, rollback and zero-downtime remain blocked until real evidence exists.
6. Preserves Phase 90.4 Gitleaks protections and the full Phase 90.11 application.

## Local verification

From the real checkout:

```powershell
cd C:\Users\dgebrekidan\Yaposan
npm run repair:phase90.12
npm run check:phase90.12
npm run test:phase90.12
npm test
npm run verify:phase90.12
```

For the Git-aware local certification:

```powershell
.\scripts\phase90.12-local-certification.ps1
```

The strict release-readiness command is expected to remain non-zero while real production blockers exist:

```powershell
npm run certify:phase90.11:full
```

Do not edit evidence JSON merely to make this command green.
