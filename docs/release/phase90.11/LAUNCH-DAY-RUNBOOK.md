# Launch-Day Runbook

## Launch-blocking conditions

Do not continue the release if the full-history secret scan is not clean, typecheck/tests fail, tenant-isolation has a known bypass, production database/storage cannot be restored, billing can double-credit, export jobs lose data, provider credentials can reach the frontend, or a critical production health check is failing.

## Pre-launch

Confirm release SHA and manifest, migrations, backup/restore evidence, DNS/TLS, API/web health, workers/queues, storage, Redis/database, Stripe webhooks, email delivery, AI budget/credits, alerts, security scanning, repository protection and production smoke tests.

## During launch

Watch web/API error rate and latency, database connections, Redis, export queue depth/stalled jobs, storage errors, Stripe webhook failures, AI spend/budget, authentication failures and alert delivery. Run `npm run verify:production` after deployment.

## Rollback criteria

Rollback on sustained elevated 5xx rates, data loss/corruption, failed migrations without a safe forward fix, broken authentication, payment-credit inconsistency, uncontrolled AI spending, inaccessible exports, or security regressions.

## Post-launch

Run the smoke suite, verify SEO/robots/sitemap, sample save/cloud-save/export/AI/credits, confirm alerts remain armed, and record the deployment ID and final certification outcome.
