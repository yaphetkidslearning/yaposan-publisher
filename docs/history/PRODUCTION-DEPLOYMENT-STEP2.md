# Production Deployment Step 2 — Render, Managed Data Services, DNS, and TLS

## Selected architecture

- Render Static Site: `app.yaposan.com`
- Render Web Service: `api.yaposan.com`
- Render Background Worker: export processing
- Render Postgres: application database
- Render Key Value: Redis collaboration and presence
- Cloudflare R2: export and asset storage
- Cloudflare DNS: application, API, and CDN records

## What is automated

`render.yaml` provisions the web app, API, worker, PostgreSQL, and Redis. Secret values use `sync: false` or generated values and must be entered in the Render dashboard. The API and worker use private datastore connection strings.

## Required manual values

Before applying the Blueprint, prepare Cloudflare R2 credentials, Stripe keys and Price IDs, OpenAI API key, Resend API key, verified sender, administrator emails, and the R2 public custom domain.

## Deployment sequence

1. Push this folder to a private GitHub repository.
2. In Render, create a Blueprint from `render.yaml`.
3. Enter every secret requested during the first Blueprint creation.
4. Wait for PostgreSQL, Redis, API, worker, and web deployments.
5. Add `app.yaposan.com` and `api.yaposan.com` as Render custom domains.
6. Create the DNS records described in `deploy/cloudflare/dns-records.example.json`.
7. Attach `cdn.yaposan.com` to the R2 bucket and apply `deploy/cloudflare/r2-cors.json`.
8. Configure Stripe webhook delivery to `https://api.yaposan.com/webhooks/stripe`.
9. Run `npm run deploy:smoke` with the hosted URLs and metrics token.

## Validation performed locally

- Render Blueprint structural declarations checked.
- No provider secrets are hard-coded.
- API Docker image includes the worker script and FFmpeg.
- DNS and R2 CORS templates parse as JSON.
- Hosted smoke-test script syntax checked.

## Still requires real accounts

This package does not create resources in the user's Render, Cloudflare, Stripe, OpenAI, or Resend accounts. Domain ownership, billing, credentials, TLS issuance, database migrations, and hosted smoke tests must be completed with real account access.
