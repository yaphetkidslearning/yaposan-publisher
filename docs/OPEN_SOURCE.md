# Open-source guide

Yaposan is published under the **MIT License**. Contributions are welcome through GitHub issues, discussions, and pull requests.

## What is open source

The repository contains the application source, API, shared UI, deployment examples, tests, documentation, and community configuration needed to develop Yaposan.

The public repository does **not** grant access to Yaposan-hosted production credentials, customer data, private infrastructure, billing accounts, or third-party service secrets.

## Ways to contribute

- Fix bugs or improve accessibility.
- Improve documentation and onboarding.
- Add tests and quality checks.
- Improve translations and terminology.
- Propose product or architecture changes in GitHub Discussions.
- Review pull requests and reproduce reported issues.

## Development flow

1. Fork the repository.
2. Create a focused branch from `main`.
3. Run `npm install`.
4. Start local development with `npm run web`.
5. Make the change and add or update tests.
6. Run `npm run open-source:preflight`.
7. Open a pull request and complete the pull-request checklist.

See `INSTALL.md`, `TESTING.md`, and `CONTRIBUTING.md` for details.

## Bring your own AI/provider

Yaposan is designed so users can connect supported external AI providers or local AI rather than requiring a shared platform AI credential. Contributors must never add real provider keys to source, tests, screenshots, logs, or examples.

## Security before public release

A source-tree scan is available with:

```bash
npm run security:secrets:tree
```

Before changing a private repository to public, run a **full Git-history** secret scan from the real Git clone:

```bash
gitleaks git . --config .gitleaks.toml
```

If any real credential is found, rotate/revoke it first. Rewriting Git history does not make an already-exposed credential safe by itself.
