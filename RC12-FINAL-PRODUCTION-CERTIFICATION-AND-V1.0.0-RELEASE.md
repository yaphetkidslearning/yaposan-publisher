# Yaposan Publisher v1.0.0 — Final Production Certification

RC12 locks the source package to version **1.0.0** and adds deterministic final-release evidence validation.

## Completed

- Final version lock across package, API, and desktop-builder metadata.
- Final certification model with SHA-256 tamper detection.
- Separation of **source release readiness** from **hosted production readiness**.
- Required evidence for regression, TypeScript, web build, production configuration, security review, restore drill, signed desktop artifacts, commit SHA, and CI build ID.
- Final RC2–RC12 focused regression command.

## Local validation in this environment

The dependency-free focused backend suite passed. ZIP integrity was also verified.

## Important certification boundary

This package is the final **v1.0.0 source release**. Hosted production is **not independently validated** in this environment because live provider credentials, native signing systems, production databases, Redis, R2, Stripe, Resend, OAuth providers, FFmpeg codecs, and a working npm registry were not available.

Before a public launch, run `npm ci`, `npm run audit:rc12`, native installer builds/signing, an isolated restore drill, and live provider smoke tests in the deployment environment. The `/release` and `/ready` evidence must report no blockers.
