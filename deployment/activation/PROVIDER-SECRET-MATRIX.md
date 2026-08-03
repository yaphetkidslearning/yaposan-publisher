# Provider Secret Matrix

| Provider | Required private values | Applied to |
|---|---|---|
| Render | generated session, worker, metrics, license and backup secrets | API and worker |
| PostgreSQL | managed `DATABASE_URL` | API and worker |
| Redis | managed `REDIS_URL` | API and worker |
| Cloudflare R2 | account ID, access key, secret key, bucket, public asset URL | API and worker |
| Stripe | secret key, webhook secret, three Price IDs | API |
| OpenAI | API key and approved model identifiers | API and worker as required |
| Resend | API key and verified sender domain/address | API |
| Administration | normalized administrator email allow-list | API |

Never paste private values into GitHub issues, source files, screenshots, or deployment reports.
