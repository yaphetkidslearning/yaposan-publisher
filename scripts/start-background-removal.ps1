$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Service = Join-Path $Root "services\background-removal"
$VenvPython = Join-Path $Service ".venv\Scripts\python.exe"

Set-Location $Service
if (-not (Test-Path $VenvPython)) {
  Write-Host "Creating background-removal virtual environment..."
  python -m venv .venv
}
& $VenvPython -m pip install -r requirements.txt
Write-Host "Starting Yaposan 94 background removal on http://127.0.0.1:8090"
Write-Host "Using: $VenvPython"
& $VenvPython -m uvicorn app:app --host 127.0.0.1 --port 8090
