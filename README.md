# Yaposan

**Yaposan** is an open-source creative design and publishing suite for creating publications, editing product images, collaborating with teams, using AI-assisted workflows, and exporting professional content.

Production site: **https://yaposan.com**

## What Yaposan includes

- Professional publication and document design
- Template-driven workflows
- Photo editing and product-image tools
- Vector, typography, layout, color, and prepress systems
- AI-assisted writing and creative workflows
- Cloud projects, version history, collaboration, comments, and approvals
- Team and organization features
- Export pipelines and production-oriented publishing workflows
- Desktop, offline-sync, mobile-companion, and public API foundations

## Project status

Yaposan is moving from feature development into production hardening, public beta, and community development.

The public repository is intended for people who want to:

- report bugs
- improve accessibility
- improve performance
- add or improve templates
- improve documentation
- fix UI and editor issues
- strengthen testing and security
- contribute platform integrations

## Community quick start

If you want to help build Yaposan, start here:

```bash
git clone https://github.com/yaphetkidslearning/yaposan-publisher.git
cd yaposan-publisher
npm ci
npm run dev:web
```

Then, before opening a pull request:

```bash
npm run typecheck
npm run test:community
```

Contributor map and priorities:

- [Architecture guide](docs/ARCHITECTURE.md)
- [Governance](GOVERNANCE.md)
- [Community support](docs/COMMUNITY-SUPPORT.md)
- [Open-source boundary](docs/OPEN-SOURCE-BOUNDARY.md)
- [Public launch checklist](docs/GITHUB-LAUNCH-CHECKLIST.md)
- [Public release certification](docs/PUBLIC-RELEASE-CERTIFICATION.md)
- [Maintainer playbook](docs/MAINTAINER-PLAYBOOK.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Community roadmap](docs/ROADMAP.md)
- [Good first issue seeds](docs/GOOD-FIRST-ISSUES.md)
- [Contributing guide](CONTRIBUTING.md)

![Yaposan preview](public/yaposan-social-card.png)

## Quick start

Requirements:

- Node.js 22+
- npm

```bash
git clone https://github.com/yaphetkidslearning/yaposan-publisher.git
cd yaposan-publisher
npm ci
npm run typecheck
npm run dev:web
```

For web development, Expo prints the local web URL after startup.

## Production configuration

Do not commit production credentials. Copy `.env.example` to a local environment file and provide real values through your deployment platform.

Public browser configuration uses:

```text
EXPO_PUBLIC_API_URL=https://yaposan-api.onrender.com
```

Production secrets such as database credentials, Stripe keys, OpenAI keys, storage credentials, session secrets, worker tokens, and email-provider credentials must remain server-side environment variables.

## Contributing

Contributions are welcome.

Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)

A typical contribution flow is:

1. Fork the repository.
2. Create a focused branch.
3. Make the change.
4. Run the relevant checks.
5. Open a pull request.
6. Address review and CI feedback.

Good first contributions include documentation fixes, accessibility improvements, regression tests, performance improvements, template-quality work, and narrowly scoped bug fixes.

## Verification

Production TypeScript gate:

```bash
npm run typecheck
```

Phase 90.3 open-source/SEO verification:

```bash
npm run verify:phase90.3
```

The broader historical codebase can be checked separately with the full TypeScript configuration when working on legacy areas.

## Security

Do not open public issues for suspected vulnerabilities or exposed credentials.

Use GitHub's private vulnerability reporting / Security Advisory workflow when available. See [SECURITY.md](SECURITY.md).

Before making a previously private repository public, maintainers should complete the secret-history audit in `docs/OPEN-SOURCE-SECURITY-CHECKLIST.md`.

## License

Yaposan source code in this repository is available under the [MIT License](LICENSE), except for third-party components, assets, fonts, libraries, and other materials that retain their own licenses.

## Documentation

The repository contains extensive phase, release, production, and validation documentation from Yaposan's development history. New contributors should start with this README and the community documents above rather than assuming every historical phase document represents current production behavior.
