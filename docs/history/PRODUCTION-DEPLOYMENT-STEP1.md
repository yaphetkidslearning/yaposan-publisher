# Production Deployment Step 1

This package prepares Yaposan Publisher v1.0.0 for container-based production deployment without embedding credentials.

## Added
- Multi-stage web image using Expo static export and non-root-compatible Nginx runtime configuration.
- Deployment compose stack for web, API, worker, PostgreSQL, and Redis.
- Strict deployment environment template covering public URLs, secrets, Stripe, OpenAI, Resend, R2, workers, and operations.
- Offline deployment validator that rejects missing values, placeholders, short secrets, non-HTTPS public URLs, and incomplete R2 configuration.
- Read-only containers, temporary filesystems, health checks, restart policies, and no-new-privileges controls.

## Local preparation
1. Copy `.env.deploy.example` to `.env.production`.
2. Replace every generated-secret marker and provider credential.
3. Run `npm run deploy:validate`.
4. Run `docker compose -f docker-compose.deploy.yml config`.
5. Build with `docker compose -f docker-compose.deploy.yml build`.
6. Start with `docker compose -f docker-compose.deploy.yml up -d`.

## Not yet validated here
- npm dependency installation and Expo web compilation.
- Docker image builds.
- Real PostgreSQL and Redis connections.
- Stripe, OpenAI, Resend, Cloudflare R2, DNS, TLS, and reverse-proxy behavior.
- Live migrations, backups, monitoring, and provider webhook delivery.
