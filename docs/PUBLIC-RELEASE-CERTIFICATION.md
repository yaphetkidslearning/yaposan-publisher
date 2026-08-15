# Public Release Certification

This document separates checks that can be validated from source from controls that must be enabled on GitHub or the production environment.

## Source-verifiable gates

Run from a fresh checkout with Node 22:

```bash
npm ci
npm run public:preflight
```

The preflight verifies TypeScript, lint, community checks, Phase 92.1 support hardening, Phase 92.2 repository/community checks, the production web build, dependency metadata, and secret-scanning configuration.

## GitHub controls — must be verified manually

- [ ] Repository visibility is intentionally Public.
- [ ] `main` ruleset/branch protection requires pull requests.
- [ ] Community CI is a required check.
- [ ] Open-source security / CodeQL / dependency review checks are required where supported.
- [ ] Force pushes and branch deletion are restricted.
- [ ] Secret scanning is enabled.
- [ ] Push protection is enabled.
- [ ] Dependabot alerts and security updates are enabled.
- [ ] Private vulnerability reporting is enabled.
- [ ] GitHub Discussions is enabled with Announcements, Ideas, Q&A, Show and Tell, Development, and Templates categories.
- [ ] Labels from `.github/labels.yml` are created.
- [ ] Initial `good first issue` and `help wanted` issues are published.

## Security and rights — release owner sign-off

- [ ] Full Git history was scanned with Gitleaks and every finding was reviewed.
- [ ] Any exposed/uncertain credential was rotated, not merely deleted from source.
- [ ] Production database, payment, AI-provider, storage, email, signing, session, worker, and admin secrets are outside the repository.
- [ ] New fonts, images, icons, audio, video, templates, models, datasets, and third-party code have documented redistribution rights.
- [ ] Public support/security URLs were tested from a logged-out browser.

A source ZIP cannot truthfully mark these external controls complete. Record the date and reviewer when the real repository is certified.
