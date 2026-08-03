# Production Deployment Step 7 — Burn-In and Stability Acceptance

This step adds repeatable production observation and acceptance controls. It does not claim that the hosted burn-in has already occurred.

## Commands

- `npm run deploy:step7:validate` validates this package.
- `npm run deploy:step7:burn-in` samples the deployed web and API endpoints and writes `deployment/burn-in/latest-report.json`.

## Recommended execution

Run a one-hour observation immediately after activation, then a strict 24-hour burn-in. Continue scheduled checks through day seven. Review infrastructure metrics directly in Render, Cloudflare, Stripe, Resend, and OpenAI because application endpoint checks cannot prove provider-side health by themselves.

Deployment Step 8 must not begin until live evidence satisfies the acceptance checklist.
