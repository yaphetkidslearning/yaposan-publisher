# Phase 90.11 Known Limitations

This package performs a **full 35-gate source/readiness check**, but it does not fabricate external evidence. The following classes remain BLOCKED until verified against the real environment: full Git history, GitHub repository settings, Render/production environment variables, DNS/TLS, email DNS/delivery, cross-tenant authenticated route tests, adversarial upload tests, browser/accessibility matrix, failure injection, export-worker recovery, migration drills, backup/restore, deployment rollback/restart tests, real Stripe flows, third-party redistribution rights, and Search Console recrawl.

Use `npm run certify:phase90.11:full` to require zero critical BLOCKED gates before declaring release-ready.
