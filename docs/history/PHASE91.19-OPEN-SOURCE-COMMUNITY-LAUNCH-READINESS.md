# Phase 91.19 — Open-Source Community Launch Readiness

Phase 91.19 turns Yaposan's existing open-source foundation into a clearer contributor onboarding and public-community launch package.

## Added

- `docs/ARCHITECTURE.md` as the short contributor-facing repository map and trust-boundary guide.
- `docs/ROADMAP.md` as a public, non-date-based contribution roadmap.
- `docs/GOOD-FIRST-ISSUES.md` with 20 seed tasks and a quality bar for beginner issues.
- Dedicated accessibility and documentation GitHub issue forms.
- Beginner-friendly package scripts: `dev`, `dev:web`, `check`, `test:community`, and `open-source:preflight`.
- Phase 91.19 static audit and regression test.

## Updated

- README now leads contributors to the architecture guide, roadmap, first-issue seeds, and simplified local commands.
- CONTRIBUTING now includes a five-minute contributor path, scope guidance, and explicit production-secret boundaries.
- Pull-request template now includes accessibility, documentation, and focused-scope checks.
- Public repository certification now includes contributor onboarding and first-issue preparation before announcement.

## Important release boundary

Phase 91.19 prepares the source package for community launch but does **not** claim the repository is already safe to switch to Public.

Before changing repository visibility, maintainers must still complete the real repository-level checks that cannot be proven from a ZIP alone, especially:

- full Git-history Gitleaks scan
- branch protection and required checks
- GitHub secret scanning and push protection
- Dependabot alerts/security updates
- private vulnerability reporting
- confirmation that production secrets remain only in the deployment secret manager

## Validation

Run:

```bash
npm run test:phase91.19
npm run check:phase91.19
```

For the broader open-source preflight on a real Git checkout with Gitleaks installed:

```bash
npm run open-source:preflight
```
