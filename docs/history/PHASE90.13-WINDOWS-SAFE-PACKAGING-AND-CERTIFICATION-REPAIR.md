# Phase 90.13 - Windows-Safe Packaging and Certification Repair

Phase 90.13 fixes the Windows Explorer `0x80010135: Path too long` packaging failure that could silently omit long-named historical/certification files.

## Changes
- Distribution archive is intentionally named `Yaposan-90.13.zip` with the short internal root `Yaposan/`.
- Phase 90.11 repair now prefers the short fallback `release/phase90.13/phase90.11-certification-template.md`.
- The canonical Phase 90.11 document remains at the path expected by existing Phase 90.11 tests/verifiers.
- Phase 90.13 regression tests prove reconstruction from the short fallback.
- Phase 90.4 Gitleaks configuration and ignored report files remain preserved.

## Verification
Run `npm run verify:phase90.13`. For the Git-aware local gate, continue using Gitleaks against the real checkout before public release.
