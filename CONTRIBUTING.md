# Contributing to Yaposan

Thank you for helping improve Yaposan. Keep changes focused, testable, documented, and safe for a public repository.

## Start here

1. Fork the repository.
2. Create a branch from `main`.
3. Install dependencies:

```bash
npm install
```

4. Start local development:

```bash
npm run web
```

## Before opening a pull request

Run:

```bash
npm run open-source:preflight
```

For UI changes, also run the web build and check the affected flow in a browser:

```bash
npm run build:web
```

## Pull-request expectations

- Keep one coherent change per pull request.
- Explain the problem and the proposed behavior.
- Add or update tests when behavior changes.
- Include before/after screenshots for meaningful visual changes.
- Update documentation when setup, environment variables, APIs, or user behavior changes.
- Preserve accessibility and keyboard behavior.
- Avoid unrelated generated or formatting changes.

## Product terminology

Keep customer-facing terminology consistent with **Page / My Page / AI Page**. Internal `spaceId` and `/api/v1/spaces` identifiers may remain where needed for compatibility.

Do not introduce numbered internal development labels into customer-facing screens, exported filenames, template tags, workflows, scripts, or public documentation.

## Security and privacy

Never commit credentials, API keys, tokens, private keys, production URLs containing secrets, or real customer data.

Use placeholders in examples. Run:

```bash
npm run security:secrets:tree
```

Maintainers should also run the Git-history scan described in `SECURITY.md` and `docs/PUBLIC-RELEASE-CHECKLIST.md` before making repository history public.

## Reporting vulnerabilities

Do not use a public issue for security vulnerabilities. Follow `SECURITY.md`.

## Community

Be respectful and constructive. Participation is governed by `CODE_OF_CONDUCT.md`. Significant product, architecture, compatibility, licensing, or governance changes should begin as a GitHub Discussion or tracked proposal.
