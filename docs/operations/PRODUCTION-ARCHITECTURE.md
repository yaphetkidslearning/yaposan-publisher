# Production Architecture

Cloudflare provides DNS, TLS edge controls, and R2 object storage. Render hosts the static web application, Node API, export worker, managed PostgreSQL, and managed Redis/Key Value. GitHub Actions validates releases and scheduled production checks. Stripe provides billing, OpenAI provides configured AI services, and Resend provides transactional email. Secrets remain in provider-managed environment storage.
