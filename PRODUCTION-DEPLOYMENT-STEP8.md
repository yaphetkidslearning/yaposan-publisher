# Production Deployment Step 8 — Official v1.0.0 Launch Certification

This step packages the final production operating materials and a deterministic launch certificate generator. It does not mark the platform live merely because files exist. Certification is issued only after real production evidence from Steps 6 and 7 is supplied and every gate passes.

## Final sequence

1. Complete live provider activation from Step 6.
2. Collect accepted 24-hour and seven-day burn-in evidence from Step 7.
3. Copy `deploy/templates/production-launch-evidence.example.json` to `deploy/evidence/production-launch-evidence.json`.
4. Replace every placeholder and set a gate to `true` only after it has been verified.
5. Run `npm run deploy:step8:certify`.
6. Archive the generated certificate, deployed commit, CI artifact, provider screenshots, and rollback snapshot.
7. Announce the launch only when the certificate status is `CERTIFIED_FOR_PRODUCTION_LAUNCH`.

## Included handbooks

- Operations handbook
- Disaster recovery handbook
- Administrator handbook
- User launch guide
- Final launch checklist
- Production architecture
- Security operations guide

## Important boundary

The downloadable package is the final production launch package and tooling. Live launch certification remains conditional until real hosted evidence is entered and accepted.
