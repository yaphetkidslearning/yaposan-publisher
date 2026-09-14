# Contributing to Yaposan

Thank you for contributing. Work from the current product architecture and maintained documentation rather than obsolete development snapshots.

## Setup

```bash
npm install
npm run web
```

## Before opening a pull request

```bash
npm run typecheck
npm run lint -- --quiet
npm run test:release
npm run build:web
```

Keep customer-facing terminology consistent with **Page / My Page**. Internal `spaceId` and `/api/v1/spaces` identifiers may remain where required for compatibility. Do not introduce numbered development labels into customer-facing screens, exported filenames, template tags, or public documentation.

Never commit credentials, API keys, tokens, private keys, or real customer data.
