# Phase 92.2 — Public Repository Certification and Community Hardening

Phase 92.2 closes source-side gaps identified before opening Yaposan to a broader open-source community.

## Added and fixed

- aligned public contributor tooling and Community CI on Node 22
- added an explicit Node engine contract and package manager metadata
- changed contributor quick-start commands to reproducible `npm ci`
- added GitHub community support routing and a question intake template
- added Discussion category form seeds for Ideas and Q&A
- added a maintainer triage/review/release playbook
- added a public-release certification document that separates source checks from GitHub/production controls
- added third-party notices and an automated dependency-license metadata check
- moved historical validation reports and legacy Phase 24.2 DOCX files out of the repository root
- added Phase 92.2 verification and regression tests
- added a single `npm run public:preflight` release command

## Important external controls

A ZIP cannot enable GitHub branch rules, secret scanning, push protection, private vulnerability reporting, Discussions, repository labels, or prove that the complete Git history has no leaked credential. Those remain explicit sign-off items in `docs/PUBLIC-RELEASE-CERTIFICATION.md`.
