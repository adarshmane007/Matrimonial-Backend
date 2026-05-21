# Start local Postgres + API
Set-Location $PSScriptRoot\..
Write-Host "Building and starting Matrimonial API + PostgreSQL..." -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nWaiting for API health..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if ($ok) {
  Write-Host "API is up: http://localhost:3001/api/health" -ForegroundColor Green
  Write-Host "Demo login: priya.jadhav@example.com / demo1234" -ForegroundColor Green
  Write-Host "`nNext: cd ..\Matrimonial && npm run dev" -ForegroundColor Yellow
} else {
  Write-Host "API not ready yet. Check: docker compose logs -f api" -ForegroundColor Yellow
}
