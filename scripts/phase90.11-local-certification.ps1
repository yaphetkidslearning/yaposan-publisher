$ErrorActionPreference = "Stop"
Write-Host "Phase 90.11 FULL local certification" -ForegroundColor Cyan
if (-not (Test-Path .git)) { throw "Run this from the real Yaposan Git checkout; .git is required." }
$steps = 12
Write-Host "[1/$steps] Working tree status"
git status --short
Write-Host "[2/$steps] Full-history Gitleaks"
gitleaks git . --config .gitleaks.toml --report-format json --report-path gitleaks-full-report.json
if ($LASTEXITCODE -ne 0) { throw "Gitleaks found remaining findings. Inspect only those findings; do not broaden the allowlist." }
Write-Host "[3/$steps] Confirm Gitleaks reports are ignored"
git check-ignore -q gitleaks-report.json; if ($LASTEXITCODE -ne 0) { throw "gitleaks-report.json is not ignored" }
git check-ignore -q gitleaks-full-report.json; if ($LASTEXITCODE -ne 0) { throw "gitleaks-full-report.json is not ignored" }
Write-Host "[4/$steps] TypeScript"
npm run typecheck
Write-Host "[5/$steps] Full tests"
npm test
Write-Host "[6/$steps] Phase 90.11 regression/security verification"
npm run verify:phase90.11
Write-Host "[7/$steps] Full 35-gate source/readiness check"
npm run check:phase90.11:full
Write-Host "[8/$steps] Dependency audit (high+)"
npm audit --audit-level=high
Write-Host "[9/$steps] Lockfile integrity dry run"
npm install --package-lock-only --ignore-scripts --dry-run
Write-Host "[10/$steps] SBOM"
npm run sbom:phase90.11
Write-Host "[11/$steps] Evidence refresh"
npm run certify:phase90.11:evidence
Write-Host "[12/$steps] Frontend provider-secret scan"
npm run check:phase90.9
Write-Host "Automated local gates completed. Review release/phase90.11/full-certification.json; external BLOCKED gates still require evidence." -ForegroundColor Green
