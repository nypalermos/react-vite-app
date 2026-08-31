$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "Stopping Docker dev stacks..."
docker compose -f docker-compose.yml down
docker compose -f docker-compose.secure.yml down
