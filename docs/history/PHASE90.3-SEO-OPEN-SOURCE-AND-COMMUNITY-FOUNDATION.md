# Phase 90.3 — SEO, Open Source & Community Foundation

Phase 90.3 prepares Yaposan for discoverability and responsible public collaboration.

## SEO

- Replaces the generic/untitled browser/search title with:
  `Yaposan — Creative Design & Publishing Suite`
- Adds a production description
- Adds canonical URL metadata
- Adds Open Graph and Twitter card metadata
- Adds SoftwareApplication structured data
- Adds `public/robots.txt`
- Adds `public/sitemap.xml`

Google must recrawl the site before an older `Untitled` result changes. After deployment, verify the generated HTML and request re-indexing through Google Search Console.

## Open source

- Replaces the inherited Expo license notice with a Yaposan MIT license
- Rebuilds the root README for public contributors
- Adds `CONTRIBUTING.md`
- Adds `CODE_OF_CONDUCT.md`
- Adds `SECURITY.md`
- Adds GitHub issue forms and pull-request template
- Adds a pre-public security checklist
- Adds an automated Phase 90.3 repository audit script

## Important

This phase does **not** automatically make the GitHub repository public.

Repository visibility should only be changed after:

- secret scanning
- Git-history review
- credential rotation where necessary
- asset/license review
- branch protection and security configuration

## Verification

```bash
npm install
npm run verify:phase90.3
```

Then build the web application and inspect the generated home-page HTML for the new title and metadata.

After production deployment:

1. open `https://yaposan.com/robots.txt`
2. open `https://yaposan.com/sitemap.xml`
3. view page source and confirm the title/description
4. add/verify the domain in Google Search Console
5. submit the sitemap
6. request re-indexing for the home page
