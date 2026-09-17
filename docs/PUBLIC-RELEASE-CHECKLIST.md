# Public repository release checklist

Use this checklist before changing the Yaposan GitHub repository from private to public.

## Source and licensing

- [ ] `LICENSE` is present and matches the intended MIT license.
- [ ] `README.md` describes the current release and local setup.
- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `GOVERNANCE.md` are current.
- [ ] Third-party notices and dependency-license checks are current.

## Secrets and private data

- [ ] Run `npm run security:secrets:tree`.
- [ ] Run `gitleaks git . --config .gitleaks.toml` from the real Git clone.
- [ ] Review old commits, tags, releases, Actions artifacts, screenshots, and logs for credentials or customer data.
- [ ] Rotate any credential that may ever have been exposed.
- [ ] Confirm `.env`, `.env.local`, `.env.production`, database files, and local persistent data are ignored.
- [ ] Confirm `.env.example` and `.env.production.example` contain placeholders only.

## Quality

- [ ] `npm run typecheck:full`
- [ ] `npm run lint -- --quiet`
- [ ] `npm run test:release`
- [ ] `npm run licenses:check`
- [ ] `npm run build:web`

## GitHub community settings

- [ ] Issues are enabled.
- [ ] Discussions are enabled if maintainers plan to use them.
- [ ] Private vulnerability reporting is enabled.
- [ ] Dependabot and CodeQL are enabled.
- [ ] `main` has branch protection / rulesets requiring review and passing checks.
- [ ] Force pushes and branch deletion are restricted for `main`.
- [ ] Maintainer permissions and CODEOWNERS are reviewed.

## Production separation

- [ ] Production secrets remain in the hosting provider, not GitHub source.
- [ ] Public contributors cannot access production databases, storage, billing, email, or admin credentials.
- [ ] Deployment workflows do not expose secret values in logs.
- [ ] Example deployment configuration clearly distinguishes required and optional variables.
