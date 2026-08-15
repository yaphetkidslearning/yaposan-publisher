# Phase 90.14 — Static SEO Head and Production Web Startup Repair

Phase 90.14 fixes the production static-export regression discovered after Phase 90.13: Expo Router successfully exported the web application, but `dist/index.html` contained an empty `<title data-rh="true"></title>`. Search engines therefore saw no Yaposan title even though Phase 90.3 metadata existed in source.

## What changed

- Adds `src/app/+html.tsx` as a build-time HTML shell with Yaposan title, description, canonical URL, Open Graph, Twitter, robots metadata, and JSON-LD.
- Keeps the Phase 90.2 Render static-site architecture: Expo static export to `dist`, `staticPublishPath: ./dist`, and the production API URL supplied at build time.
- Adds a deterministic post-export repair step. `npm run build:web` now patches every exported HTML file so an empty or missing title cannot ship.
- Adds `scripts/verify-phase90.14.mjs` and route-independent regression tests.
- Strengthens `verify:production` to accept title attributes, verify a non-empty Yaposan title, and support a separately hosted sitemap through `YAPOSAN_SITEMAP_URL`.
- Preserves Phase 90.4 Gitleaks defaults and all Phase 90.5–90.13 security controls.

## Certification

Run:

```powershell
npm run test:phase90.14
npm run build:web
npm run check:phase90.14
```

Then confirm:

```powershell
Select-String -Path .\dist\index.html -Pattern '<title','Yaposan','Creative Design','Publishing Suite'
```

The built artifact must contain a non-empty Yaposan title before deployment or Google Search Console re-indexing.
