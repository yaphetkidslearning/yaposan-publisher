# Installing Yaposan

## Requirements

- Node.js 22 or a compatible supported Node.js release
- npm
- PostgreSQL for persistent production/server use
- Docker only when using containerized supporting services

## Install dependencies

```bash
npm install
```

## Configure environment

Copy `.env.example` to `.env` for local development and fill only the values you need. For production, start from `.env.production.example` and replace every placeholder with real production configuration.

Never commit `.env`, secrets, tokens, private keys, or production credentials.

## Start locally

```bash
npm run web
```

API only:

```bash
npm run server
```

## Validate the installation

```bash
npm run typecheck
npm run lint -- --quiet
npm run test:release
npm run build:web
```
