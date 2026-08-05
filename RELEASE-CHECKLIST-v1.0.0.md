# Yaposan Publisher v1.0.0 Release Checklist

## Source and CI

- [ ] `npm ci` completes from the committed lockfile.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:phase86` passes.
- [ ] Production web export/build passes.
- [ ] Git commit SHA and CI build ID are recorded.

## Hosted production

- [ ] Render production environment validation passes.
- [ ] PostgreSQL migrations and connectivity are verified.
- [ ] Redis/Valkey connectivity is verified.
- [ ] R2 object storage upload and download are verified.
- [ ] `yaposan.com`, `www.yaposan.com`, `app.yaposan.com`, and API domains have valid TLS.
- [ ] Stripe live secret, webhook secret, and live Price IDs are configured.
- [ ] Stripe checkout, webhook synchronization, cancellation, and customer portal are tested.
- [ ] OpenAI production key and quota behavior are tested.
- [ ] Backup creation, checksum verification, and restore drill are completed.
- [ ] Admin access and audit logs are verified.

## Desktop distribution

- [ ] Windows code-signing certificate required before public NSIS/portable release.
- [ ] Apple Developer credentials required before notarized macOS DMG/ZIP release.
- [ ] Linux AppImage/DEB artifacts are built and smoke-tested.
- [ ] Auto-update release channel is tested with signed artifacts.

## Mobile distribution

- [ ] Apple Developer credentials required for signed iOS/TestFlight/App Store builds.
- [ ] Google Play signing credentials required for signed Android internal/production builds.
- [ ] Privacy disclosures, screenshots, age ratings, and store metadata are approved.

## Launch

- [ ] Privacy Policy, Terms, Acceptable Use, and refund policy are published.
- [ ] Support and incident-response contacts are active.
- [ ] Status page and monitoring alerts are active.
- [ ] Rollback procedure is rehearsed.
