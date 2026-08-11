$ErrorActionPreference = "Stop"
Write-Host "Phase 90.9 local certification" -ForegroundColor Cyan

if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
  throw "Gitleaks is not installed or not available in PATH."
}

gitleaks git . --config .gitleaks.toml
if ($LASTEXITCODE -ne 0) { throw "Gitleaks found unreviewed findings." }

git check-ignore -v gitleaks-report.json
git check-ignore -v gitleaks-full-report.json
npm run verify:phase90.9
if ($LASTEXITCODE -ne 0) { throw "Phase 90.9 verification failed." }

Write-Host "Phase 90.9 local certification passed. Repository may proceed to public-release settings review." -ForegroundColor Green
