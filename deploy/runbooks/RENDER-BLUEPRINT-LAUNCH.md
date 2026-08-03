# Render Blueprint launch

1. Push this project to a private GitHub repository with `main` protected.
2. In Render, create a Blueprint and select the repository.
3. Review the five resources from `render.yaml`; do not deploy until all names and regions are correct.
4. Enter every `sync: false` secret listed in `deploy/github/REQUIRED-SECRETS.md`.
5. Deploy PostgreSQL and Redis first, then the API and worker, then the static web service.
6. Confirm `/live`, `/health`, `/ready`, and `/release` on the Render API hostname.
7. Attach `api.yaposan.com` and `app.yaposan.com` only after temporary hostnames pass smoke tests.
8. Run `APP_URL=https://app.yaposan.com API_URL=https://api.yaposan.com METRICS_TOKEN=... npm run deploy:smoke`.

A successful Blueprint creation is not production certification. Keep traffic off until DNS, Stripe webhooks, R2, email, and restore checks pass.
