# Security Policy

## Supported release

Security fixes are currently focused on Yaposan v1.x and the production services that support `https://yaposan.com`.

## Reporting a vulnerability

Please do **not** open a public issue for:

- authentication bypasses
- authorization flaws
- exposed credentials
- remote-code execution
- injection vulnerabilities
- payment or billing vulnerabilities
- private-data exposure
- storage access flaws
- secret/token leakage

Use GitHub private vulnerability reporting or a private Security Advisory for this repository when available.

Include:

- affected component
- reproduction steps
- impact
- logs or screenshots with secrets removed
- suggested remediation, if known

## Credentials and secrets

Never commit real:

- database URLs or passwords
- session/JWT secrets
- Stripe secret keys or webhook secrets
- OpenAI API keys
- R2/S3 access keys
- email-provider credentials
- worker/admin/metrics tokens
- private keys or certificates

Rotate any credential that has been committed, printed in public logs, or exposed to an untrusted party. Removing a secret from the latest commit is not sufficient if it remains in Git history.

## Scope

The project welcomes responsible reports covering the web application, API, authorization boundaries, billing, storage, export jobs, collaboration, and deployment configuration.
