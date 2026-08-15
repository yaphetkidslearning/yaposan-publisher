# Maintainer Playbook

This playbook turns the governance and community files into a repeatable operating process.

## Triage

Review new Issues and Discussions regularly. Apply a type label (`bug`, `enhancement`, `documentation`, `accessibility`, `security`, `performance`, `templates`, `AI`, `editor`, `frontend`, or `backend`) and a state label when useful (`needs reproduction`, `blocked`, `help wanted`, `good first issue`). Close duplicates with a link to the canonical thread.

Security reports must not be handled in public Issues. Move reporters to the private vulnerability-reporting path described in `SECURITY.md`.

## Pull requests

Require the Community CI and security checks on `main`. Prefer focused pull requests. At least one maintainer review should be required for normal changes; sensitive areas such as authentication, billing, AI provider secrets, deployment, data deletion, and permission boundaries should receive explicit maintainer review.

Before merge, confirm tests, documentation, screenshots for UI changes, migration impact, environment-variable impact, and third-party asset provenance where relevant.

## Releases

Before a public release:

1. Run `npm ci` from a clean checkout.
2. Run `npm run public:preflight`.
3. Review dependency and asset licensing changes.
4. Confirm no secrets exist in the current tree or Git history.
5. Confirm production credentials are supplied only by the deployment environment.
6. Review open critical/high security findings.
7. Publish release notes and known limitations.

## Community health

Keep a small set of genuinely approachable `good first issue` tasks available. Thank contributors, add merged contributors to `CONTRIBUTORS.md`, and avoid leaving community pull requests without a status update for extended periods.
