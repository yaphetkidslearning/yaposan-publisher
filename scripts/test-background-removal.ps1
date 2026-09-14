param(
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [ValidateSet("fast","auto","quality","ultra")][string]$Quality = "quality"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $ImagePath)) { throw "Image not found: $ImagePath" }
$ext=[IO.Path]::GetExtension($ImagePath).ToLowerInvariant()
$mime = if ($ext -eq ".png") { "image/png" } elseif ($ext -in ".jpg", ".jpeg") { "image/jpeg" } elseif ($ext -eq ".webp") { "image/webp" } else { throw "Use PNG, JPG/JPEG, or WEBP." }
$bytes=[IO.File]::ReadAllBytes($ImagePath)
$body=@{
 image_base64=[Convert]::ToBase64String($bytes); mime_type=$mime; background="transparent";
 quality_mode=$Quality; preset="transparent-original"; padding_percent=0; square_canvas=$false;
 preserve_shadow=$false; category_hint="auto"; output_format="png"; strict_white=$false; white_audit_threshold=1
} | ConvertTo-Json -Depth 5
$elapsed=Measure-Command { $result=Invoke-RestMethod -Uri "http://127.0.0.1:8090/remove-background" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 600 }
$out=[IO.Path]::Combine([IO.Path]::GetDirectoryName((Resolve-Path $ImagePath)),([IO.Path]::GetFileNameWithoutExtension($ImagePath)+"-removed.png"))
[IO.File]::WriteAllBytes($out,[Convert]::FromBase64String($result.image_base64))
[PSCustomObject]@{ seconds=[math]::Round($elapsed.TotalSeconds,3); model=$result.used_model; subjectLane=$result.subject_lane; quality=$result.quality_status; score=$result.quality_score; output=$out }
