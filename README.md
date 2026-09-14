# Yaposan

Yaposan is a creator platform for personal AI Pages, social publishing, creative Studios, tools, projects, files, commerce, and user-controlled AI/provider connections.

## Current release

Version **119.3.4** is the production-clean source release. The repository intentionally excludes obsolete milestone reports, validation snapshots, and other historical packaging clutter.

## Quick start

```bash
npm install
npm run web
```

For the API only:

```bash
npm run server
```

## Quality checks

```bash
npm run typecheck
npm run lint -- --quiet
npm run test:release
npm run build:web
```

The source package does not include `node_modules`; install dependencies before running dependency-based checks.

## Main product areas

- Personal AI Page with profile, cover, followers, public publishing, privacy, and direct messages.
- Social feed with posts, Stories, Reels, Communities, Events, Live, Channels, Notes, Polls, and Collab / Remix.
- AI models and user-controlled provider/API connections.
- Creative Studios, Publisher, image/video/audio tools, templates, projects, and files.
- Creator marketplace, usage/billing, team controls, administration, security, and production operations.

## Repository map

- `src/app/` — application routes and screens
- `src/components/` — reusable UI
- `src/utils/` — product engines and shared logic
- `src/templates/` — editable design template catalog
- `server/` — API and server services
- `database/migrations/` — ordered database migrations
- `services/` — supporting services such as background removal
- `tests/current-release.test.mjs` — current structural/product regression suite
- `docs/` — maintained documentation

See `INSTALL.md`, `TESTING.md`, `SECURITY.md`, `CONTRIBUTING.md`, and `docs/ARCHITECTURE.md` for more detail.
