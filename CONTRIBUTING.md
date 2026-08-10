# Contributing to Yaposan

Thank you for helping improve Yaposan.

## Before you start

- Search existing issues and pull requests first.
- Keep contributions focused. One bug fix or feature area per pull request is preferred.
- Do not include secrets, customer data, private credentials, copyrighted assets without permission, or proprietary code you do not have the right to contribute.

## Development setup

```bash
npm install
npm run typecheck
npm start
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
