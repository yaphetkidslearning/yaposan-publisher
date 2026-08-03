# Production Deployment Step 5 — Post-Cutover Verification and Launch Monitoring

This step does not claim that live deployment has occurred. It supplies the verification and monitoring controls to run after Render services and Cloudflare DNS are active.

## Execution order

1. Confirm `app.yaposan.com` and `api.yaposan.com` resolve to the intended services.
2. Set GitHub repository variables `YAPOSAN_APP_URL` and `YAPOSAN_API_URL`.
3. Store `METRICS_TOKEN` as a GitHub Actions secret.
4. Run `npm run deploy:post-cutover` locally or dispatch the post-deploy workflow.
5. Review the generated JSON report and require zero failures.
6. Configure uptime and alert rules using `deployment/monitoring/alert-policy.example.json`.
7. Observe the launch dashboard for at least 24 hours before calling the release stable.
8. Use the incident severity and rollback rules when a launch threshold is exceeded.

## Required environment

- `YAPOSAN_APP_URL=https://app.yaposan.com`
- `YAPOSAN_API_URL=https://api.yaposan.com`
- `EXPECTED_RELEASE_VERSION=1.0.0`
- `METRICS_TOKEN` stored only in a secret manager

## Completion criteria

- Web and API endpoints pass.
- Required security headers are present.
- `/live`, `/health`, and `/ready` pass.
- `/release` reports exactly `1.0.0`.
- Authenticated metrics are readable.
- Monitoring and rollback ownership are assigned.
- No unresolved critical or high-severity launch incidents remain.
