# Public Release Certification

A source package is ready for public release only after dependency installation and successful completion of:

```bash
npm run typecheck
npm run lint -- --quiet
npm run test:release
npm run build:web
npm run licenses:check
```

Production deployment additionally requires validated environment configuration, live service checks, database migration verification, backup/restore readiness, provider/webhook verification, and security review. Source-level tests do not replace live-environment certification.
