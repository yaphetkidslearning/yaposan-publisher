# DNS Cutover and Rollback

## Before cutover
- Record the existing DNS values and screenshots.
- Reduce TTL to 300 seconds at least one propagation window before launch.
- Verify temporary Render web and API URLs.
- Verify the R2 custom domain and a test object.
- Confirm Stripe webhook destination uses the final API hostname.
- Confirm Resend domain verification is complete.

## Cutover order
1. `assets.yaposan.com`
2. `api.yaposan.com`
3. `app.yaposan.com`

After each change, verify TLS, HTTP status, readiness, release version, and browser loading before proceeding.

## Rollback
Restore the recorded previous DNS values in reverse order. Pause Render auto-deploy, preserve logs and database state, and do not delete the failed deployment until evidence is collected.
