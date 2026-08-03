# Required production secrets

Do not commit these values. Enter them in the Render dashboard for both the API and worker where applicable.

## Cloudflare R2
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `PUBLIC_ASSET_BASE_URL`

## Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_CREATOR`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_BUSINESS`

## AI and email
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

## Administration
- `ADMIN_EMAILS`

Render generates `SESSION_SECRET`, `EXPORT_WORKER_TOKEN`, `BACKUP_SIGNING_SECRET`, `LICENSE_SIGNING_SECRET`, and `METRICS_TOKEN`. Preserve generated values during redeployments and rotations.
