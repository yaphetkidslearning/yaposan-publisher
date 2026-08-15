# Yaposan Architecture Guide

This guide gives new contributors a practical map of the repository. It is intentionally shorter than the historical phase documentation.

## High-level shape

Yaposan is a multi-surface creative publishing platform built around an Expo/React application, server-side APIs and workers, persistent project data, production deployment tooling, and optional AI providers.

| Area | Location | Purpose |
| --- | --- | --- |
| App routes and screens | `src/app/` | User-facing pages and navigation |
| Reusable UI | `src/components/` | Shared interface and workspace components |
| Client utilities | `src/utils/`, `src/lib/` when present | Shared browser/app behavior |
| Server | `server/` | Server-only API and worker code |
| Services | `services/` | Service integrations and supporting runtimes |
| Database | `database/` | Schema, migrations, and database support files |
| Public assets | `public/`, `assets/` | Public web and application assets |
| Tests | `tests/` | Regression and phase verification tests |
| Static verification | `scripts/` | Release, security, and repository checks |
| Deployment | `deploy/`, `deployment/` | Production deployment documentation and configuration |
| Desktop | `desktop/` | Desktop packaging/runtime work |
| Community files | `.github/`, root Markdown files | Issues, pull requests, security, contributor guidance |

## Trust boundaries

A public contributor should be able to build and test Yaposan without receiving production credentials.

### Browser-safe configuration

Values beginning with `EXPO_PUBLIC_` are visible to users and must never contain secrets.

### Server-only configuration

Keep these on trusted server/deployment infrastructure:

- database credentials
- session and signing secrets
- Stripe secret and webhook keys
- hosted AI-provider keys
- object-storage secret keys
- email-provider credentials
- worker/admin/metrics tokens

Contributors should use sanitized examples such as `.env.example` and local test credentials.

## AI model

Yaposan supports several AI access paths. The open-source application should preserve clear cost and trust boundaries:

1. Local AI can run on user-controlled hardware where supported.
2. Community AI may use a Yaposan-sponsored shared budget.
3. Bring-your-own-provider connects a user's provider account and limits.
4. Yaposan AI Credits provide an optional prepaid hosted path.

Do not move provider secrets into browser code to simplify development.

## Contribution workflow

For most changes:

```bash
npm ci
npm run dev:web
npm run typecheck
npm run test:community
```

For a focused feature, also run the tests closest to the files you changed. Maintainers may require broader release checks before merge.

## Where to start

- UI bug: `src/app/` and `src/components/`
- Help/documentation: `README.md`, `docs/`, or public help routes
- Accessibility: affected route/component plus a regression test
- Templates: locate the relevant template library/module and keep the change focused
- API/server work: `server/` and its tests; never require production secrets
- Security: read `SECURITY.md` first and report vulnerabilities privately

## Historical phase documents

The repository contains extensive phase records. They are useful implementation history, but they are not the recommended onboarding path. Start with:

1. `README.md`
2. `CONTRIBUTING.md`
3. this architecture guide
4. `docs/ROADMAP.md`
5. the issue you intend to work on

Then consult a phase document only when it is directly relevant to the area you are changing.
