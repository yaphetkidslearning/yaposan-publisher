# Contributing to Yaposan

Thank you for helping improve Yaposan.

## Before you start

- Search existing issues and pull requests first.
- Keep contributions focused. One bug fix or feature area per pull request is preferred.
- Do not include secrets, customer data, private credentials, copyrighted assets without permission, or proprietary code you do not have the right to contribute.

## Five-minute contributor path

You do not need production credentials or knowledge of the historical phase documents to make a useful contribution.

1. Pick one focused issue, preferably `good first issue` or `help wanted`.
2. Read `docs/ARCHITECTURE.md` for the repository map and trust boundaries.
3. Install dependencies and start the web app.
4. Make one scoped change and add or update regression coverage when practical.
5. Run the relevant checks and open a pull request.

```bash
npm ci
npm run dev:web
npm run typecheck
npm run test:community
```

See `docs/ROADMAP.md` for contribution priorities and `docs/GOOD-FIRST-ISSUES.md` for beginner-task seeds.

## Development setup

```bash
npm ci
npm run typecheck
npm run dev:web
```

For Phase 90.3 checks:

```bash
npm run verify:phase90.3
```

## Branches and commits

Use a descriptive branch name, for example:

```text
fix/editor-backspace
docs/api-setup
perf/template-loading
feat/template-search-filter
```

Use concise commit messages that describe the change.

## Pull requests

A good pull request should explain:

- what changed
- why it changed
- how it was tested
- screenshots for meaningful UI changes
- any deployment or environment-variable impact
- any known limitations

Please avoid unrelated formatting or generated-file changes.

## Testing expectations

At minimum:

```bash
npm run typecheck
```

Run tests that cover the area you changed. Add regression coverage when fixing a bug where practical.

## Areas especially welcome

- accessibility
- editor reliability
- performance
- template quality
- documentation
- automated tests
- localization readiness
- browser compatibility
- production observability
- security hardening

## Security issues

Do not disclose vulnerabilities or secrets in public issues. Follow `SECURITY.md`.

## Review

Maintainers may request changes before merge. A pull request may be declined when it is too broad, unsafe, untestable, duplicative, or inconsistent with the project's direction.


## Production boundaries

Community contributors should never need Yaposan production credentials. Do not request, share, or commit production database passwords, signing/session secrets, Stripe secrets, hosted AI-provider keys, storage secrets, email credentials, or worker/admin tokens.

`EXPO_PUBLIC_*` values are browser-visible by design and must not contain secrets. Use sanitized examples and local/test configuration for development.

## Choosing scope

Prefer a pull request that can be reviewed as one coherent change. If an idea touches unrelated editor, billing, deployment, and AI-provider behavior at the same time, open an issue first so the work can be split safely.

## Full public-repository preflight

Maintainers and contributors touching release/security/community infrastructure can run:

```bash
npm ci
npm run public:preflight
```

This is intentionally stricter than the minimum check for a small documentation-only pull request.
