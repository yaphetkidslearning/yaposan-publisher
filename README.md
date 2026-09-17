# Yaposan

Yaposan is an open-source platform for creating a personal AI-powered Page / digital space, connecting a preferred AI provider or supported local AI, publishing content, communicating with a community, and using built-in creative tools.

## Current release

Version **119.10.8** is the open-source-readiness release. It keeps the 119.10.7 homepage, authentication, AI Page routing, and verified-email behavior while improving public-repository onboarding, contribution guidance, secret scanning, and GitHub workflows.

## Quick start

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run web
```

`npm run web` starts the local API and Expo web experience together. For the API only:

```bash
npm run server
```

Copy `.env.example` to `.env` only when you need local service configuration. Never commit `.env` or real credentials.

## Quality checks

```bash
npm run typecheck:full
npm run lint -- --quiet
npm run test:release
npm run security:secrets:tree
npm run licenses:check
npm run build:web
```

For the normal contributor gate, run:

```bash
npm run open-source:preflight
```

## Main product areas

- Personal AI Page with profile, cover, followers, publishing, privacy, direct messages, and AI connections.
- Social content and community features.
- Bring-your-own AI provider and supported local AI workflows.
- Creative Studios, Publisher, image/video/audio tools, templates, projects, and files.
- Creator commerce, team controls, administration, security, and production operations.

## Repository map

- `src/app/` — application routes and screens
- `src/components/` — reusable UI
- `src/utils/` — product engines and shared logic
- `src/templates/` — editable design template catalog
- `server/` — API and server services
- `database/migrations/` — ordered database migrations
- `services/` — supporting services
- `tests/current-release.test.mjs` — current structural/product regression suite
- `docs/` — maintained architecture, open-source, and operating documentation
- `.github/` — issue templates, pull-request template, Dependabot, CodeQL, and CI workflows

## Contributing

Contributions are welcome. Start with `CONTRIBUTING.md` and `docs/OPEN_SOURCE.md`. Bug reports, accessibility fixes, documentation, tests, translations, and focused product improvements are all useful.

Before opening a pull request:

```bash
npm run open-source:preflight
```

## Security

Do not open public issues for vulnerabilities or exposed credentials. Follow `SECURITY.md` and use GitHub private vulnerability reporting when available.

Before making a private repository public, follow `docs/PUBLIC-RELEASE-CHECKLIST.md` and run a full Git-history secret scan in the real Git clone.

## License

Yaposan is licensed under the **MIT License**. See `LICENSE` and `THIRD_PARTY_NOTICES.md`.
