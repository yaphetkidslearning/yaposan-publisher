# Public Website and Application Separation

- `https://yaposan.com` — public marketing, templates, pricing, documentation, legal pages, sign-in entry.
- `https://app.yaposan.com` — guest editor and authenticated creative application.
- `https://api.yaposan.com` — backend API only.

Recommended Render setup: two web/static services built from the same repository with separate environment variables:

- `YAPOSAN_SURFACE=public`, `PUBLIC_SITE_URL=https://yaposan.com`
- `YAPOSAN_SURFACE=app`, `APP_SITE_URL=https://app.yaposan.com`

The root domain should never expose private account or administration routes directly.
