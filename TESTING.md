# Testing Yaposan

The maintained release checks use neutral command names and focus on the current product architecture.

## Current release regression

```bash
npm run test:release
```

This checks release-version alignment, source cleanup rules, Page presentation persistence, stale-state protection, DM read-state wiring, dashboard summaries, social privacy/media/navigation, public Page actions, and active backend module wiring.

## TypeScript

```bash
npm run typecheck
```

## Lint

```bash
npm run lint -- --quiet
```

## Web build

```bash
npm run build:web
```

## Full local check

```bash
npm run check
npm run test:release
npm run build:web
```

Install dependencies first. The distributable ZIP intentionally does not include `node_modules`.
