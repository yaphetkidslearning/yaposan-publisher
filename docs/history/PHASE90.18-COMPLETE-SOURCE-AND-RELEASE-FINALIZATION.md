# Phase 90.18 — Complete Source and Release Finalization

Phase 90.18 repairs a packaging regression discovered in the prior Phase 90.17 handoff: an archive could be produced without the application source tree. The release package must now prove that core application, test, script, configuration, and open-source files are present before an archive is accepted.

## Core package integrity

The source archive must contain at minimum `package.json`, `package-lock.json`, `src/`, `server/`, `scripts/`, `tests/`, `.github/`, `LICENSE`, `.env.example`, and the current Phase 90.17/90.18 release files.

The packager must continue excluding `node_modules`, `dist`, `.expo`, caches, coverage output, logs, nested ZIP files, Gitleaks report artifacts, and non-example `.env` files.

## Release status

Automated source, TypeScript, regression, and production-web gates can be verified locally. Browser matrix, WCAG 2.2 AA, production email, graceful-degradation, backup/restore, rollback, and zero-downtime remain external operational evidence and must not be self-certified.
