$ErrorActionPreference = "Stop"

Write-Host "Phase 90.2 production validation" -ForegroundColor Cyan

$markers = Select-String -Path "server\index.ts" -Pattern '<<<<<<<|=======|>>>>>>>|Fix API startup for Render'
if ($markers) {
  Write-Host "Merge artifacts found in server/index.ts:" -ForegroundColor Red
  $markers | ForEach-Object { Write-Host $_ }
  exit 1
}

Write-Host "server/index.ts merge-artifact check passed." -ForegroundColor Green
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Phase 90.2 production typecheck passed." -ForegroundColor Green
