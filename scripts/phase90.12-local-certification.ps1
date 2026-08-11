$ErrorActionPreference = "Stop"
Write-Host "Phase 90.12 local certification - repaired packaging and full release gates"

node scripts/ensure-phase90.11-canonical-doc.mjs

gitleaks git . --config .gitleaks.toml --report-format json --report-path gitleaks-full-report.json

git check-ignore -v gitleaks-report.json
git check-ignore -v gitleaks-full-report.json

npm run typecheck
npm run check:phase90.9
npm run check:phase90.11
npm run check:phase90.11:full
npm run check:phase90.12
npm test
npm audit --audit-level=high
npm run sbom:phase90.11
npm run certify:phase90.11:evidence

Write-Host "Phase 90.12 local code/package certification completed."
Write-Host "Run npm run certify:phase90.11:full separately; it remains strict and may fail until production evidence is complete."
