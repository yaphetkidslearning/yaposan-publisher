# Yaposan

**Your AI. Your Page. Your Digital Space.**

Yaposan is an open-source project for creating a personal AI-powered Page / digital space where people, creators, professionals, and businesses can bring together their AI, content, community, work, files, and creative tools.

Website: **https://yaposan.com**

## Help Build Yaposan

Yaposan is still under active development. I am opening the project so other developers, designers, AI enthusiasts, testers, accessibility contributors, documentation writers, and anyone interested in the idea can help shape it.

The core idea is simple:

> **Everyone should be able to have their own AI-powered page on the internet.**

A Yaposan AI Page is intended to become more than a chatbot. A Page can grow into a personal digital space with:

- a personal AI
- posts and publishing
- videos and live streaming
- followers, comments, and direct messages
- projects, files, portfolio, and work
- products and services
- custom AI knowledge and API connections
- team collaboration
- public, private, team, and paid content

Yaposan also includes creative tools such as Publisher, templates, image tools, video tools, background removal, documents, and other AI-assisted workflows. These tools are meant to support the AI Page ecosystem rather than be the product by themselves.

## Vision

The long-term goal is to make Yaposan an open platform where people can build and control their own AI-powered presence on the internet.

Yaposan is also designed around **bring your own AI**. Users should be able to connect supported external AI providers or supported local AI instead of being forced to depend on one shared AI provider or one platform-owned API account.

The project is not finished. There is still a lot to build, improve, test, simplify, and secure. That is why contributions and feedback are welcome now.

## Want to help?

You can contribute in many ways:

- AI and LLM integrations
- frontend and UI/UX
- backend and APIs
- security and privacy
- mobile and responsive design
- accessibility
- creative and publishing tools
- testing and bug fixes
- documentation and onboarding
- translations and terminology
- architecture and performance
- feature ideas and product discussions

You do **not** have to be an expert to participate. If you are interested in the idea, feel free to open an **Issue**, start a **Discussion**, or submit a **Pull Request**.

Start with:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow and expectations
- [`docs/OPEN_SOURCE.md`](docs/OPEN_SOURCE.md) — open-source boundaries and development flow
- [`INSTALL.md`](INSTALL.md) — local setup
- [`TESTING.md`](TESTING.md) — validation and testing
- [`SECURITY.md`](SECURITY.md) — security reporting

## Current release

Version **119.10.9** is the contributor-facing open-source presentation release. It keeps the 119.10.8 open-source readiness, secret scanning, GitHub workflows, homepage behavior, authentication, AI Page routing, and verified-email behavior while making the public repository explain the Yaposan vision and contribution opportunities more clearly.

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

## Security

Do not open public issues for vulnerabilities or exposed credentials. Follow `SECURITY.md` and use GitHub private vulnerability reporting when available.

Before making a private repository public, follow `docs/PUBLIC-RELEASE-CHECKLIST.md` and run a full Git-history secret scan in the real Git clone.

## License

Yaposan is licensed under the **MIT License**. See `LICENSE` and `THIRD_PARTY_NOTICES.md`.
