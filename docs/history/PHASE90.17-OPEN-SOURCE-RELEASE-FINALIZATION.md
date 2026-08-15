# Phase 90.17 — Open-Source Release Finalization

Phase 90.17 makes the public source tree reproducible and contributor-ready without claiming external evidence that has not actually been collected.

## Automated requirements

- `package.json` direct dependencies must be represented by the root package in `package-lock.json`.
- A safe `.env.example` must document public configuration without secrets.
- `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md` must remain present.
- GitHub issue/PR templates and Dependabot configuration must remain present.
- The source release packager must exclude installed dependencies, generated builds, caches, logs, nested ZIPs, and real `.env` files.
- The normal `npm test` release chain must include Phase 90.17.

## External evidence still required

A real public-hosting run must supply GitHub Actions results, an independent clean clone, license/asset approval, and a final public/private boundary review. These are intentionally not pre-marked as passed.
