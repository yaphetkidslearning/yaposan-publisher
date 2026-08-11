# Public Repository Certification Checklist

Do not make the repository public until the full Git-history Gitleaks command reports zero unreviewed findings.

- [ ] `gitleaks git . --config .gitleaks.toml` is clean.
- [ ] `gitleaks-report.json` and `gitleaks-full-report.json` are ignored.
- [ ] `npm run verify:phase90.9` passes.
- [ ] No provider/service API keys are referenced through `EXPO_PUBLIC_*` frontend variables.
- [ ] `main` branch protection remains enabled.
- [ ] Pull requests are required before merging to `main`.
- [ ] Required status checks include the open-source security workflow.
- [ ] GitHub secret scanning and push protection are enabled where the repository/account supports them.
- [ ] Dependabot alerts and security updates are enabled.
- [ ] Security advisories remain the private vulnerability-reporting path.
- [ ] Production environment secrets exist only in the deployment secret manager, never in committed files.
