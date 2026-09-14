# Yaposan Architecture

Yaposan is split into a client application, shared product engines, a server/API layer, database migrations, supporting services, and deployment tooling.

## Client

`src/app/` contains routes/screens. `src/components/` contains reusable UI. `src/utils/` contains product logic and state helpers. `src/templates/` contains the editable design catalog.

## Server

`server/index.ts` is the API entry point. Feature-focused modules such as `commerce.ts`, `admin.ts`, `trustSafety.ts`, and `production.ts` provide domain services without exposing old development milestone names.

## Data

`database/migrations/` contains ordered SQL migrations. Existing internal `spaceId` and `/api/v1/spaces` identifiers are retained for compatibility, while customer-facing terminology uses Page / My Page.

## Quality

`tests/current-release.test.mjs` protects the current release structure and core Page/social/DM behavior. CI runs typecheck, lint, the current release regression, and the web build.
