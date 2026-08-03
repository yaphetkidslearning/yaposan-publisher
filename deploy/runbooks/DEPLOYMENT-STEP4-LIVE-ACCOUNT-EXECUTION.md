# Deployment Step 4 — Live Account Execution

This runbook is the controlled handoff for actions that require the owner's GitHub, Render, and Cloudflare accounts.

1. Create a private GitHub repository and push this project to `main`.
2. Enable branch protection: require the production-release workflow, block force pushes, and require pull requests.
3. In Render, create a Blueprint from `render.yaml` and confirm web, API, worker, PostgreSQL, and Redis resources appear.
4. Enter every secret from `deploy/step4/provider-secrets-handoff.env.example` directly in provider dashboards.
5. Verify the temporary Render URLs using `deploy/step4/temporary-urls.env.example` and `npm run deploy:smoke`.
6. Confirm `/ready` is healthy and `/release` reports version `1.0.0` before any DNS change.
7. Create the R2 bucket, apply `deploy/cloudflare/r2-cors.json`, and activate the custom asset domain.
8. Follow `DNS-CUTOVER-AND-ROLLBACK.md` for production DNS.

Do not continue to public launch while any readiness, release, worker, database, Redis, R2, email, billing, or identity check is failing.
