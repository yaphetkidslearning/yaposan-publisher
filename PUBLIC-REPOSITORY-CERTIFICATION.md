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

## Community launch checks

Complete these before announcing the repository broadly:

- [ ] `README.md` public links and preview image render correctly.
- [ ] `docs/ARCHITECTURE.md` matches the current repository structure.
- [ ] `docs/ROADMAP.md` reflects current contribution priorities.
- [ ] At least 10 focused issues are prepared, including several `good first issue` tasks.
- [ ] `good first issue`, `help wanted`, `documentation`, `accessibility`, `bug`, and `enhancement` labels exist.
- [ ] A fresh contributor can install and start the web app without production credentials.
- [ ] Bug, feature, accessibility, documentation, and pull-request templates render correctly.
