# Phase 91.16 — Google SEO and Brand Identity

Phase 91.16 hardens the production web output so search engines receive a stable Yaposan title, favicon, logo, canonical URL, social preview, and structured identity directly from the statically rendered page.

## Added

- Explicit public favicon assets at 48x48 and 96x96 plus `favicon.ico`.
- Apple touch icon and 192/512 square Yaposan brand icons.
- 1200x630 Open Graph/Twitter social card.
- Web app manifest with canonical Yaposan icons and colors.
- Organization, WebSite, and SoftwareApplication JSON-LD graph.
- Explicit Open Graph and Twitter image metadata.
- A 91.16 test and verification gate that rejects an exported `Untitled` title.
- Production checks for robots.txt and sitemap.xml canonical URLs.

## Google deployment acceptance

After `npm run verify:phase91.16` passes and `dist` is deployed, verify these URLs return real files:

- https://yaposan.com/favicon.ico
- https://yaposan.com/favicon-48x48.png
- https://yaposan.com/favicon-96x96.png
- https://yaposan.com/yaposan-logo-512.png
- https://yaposan.com/yaposan-social-card.png
- https://yaposan.com/robots.txt
- https://yaposan.com/sitemap.xml

Then inspect `view-source:https://yaposan.com/` and confirm the title contains `Yaposan — AI Creative Design & Productivity Suite` and never `Untitled`.

Finally, use Google Search Console URL Inspection for `https://yaposan.com/`, run Test Live URL, request indexing, and resubmit `https://yaposan.com/sitemap.xml`. Search-result title/favicon changes depend on Google's next crawl and are not instantaneous.
