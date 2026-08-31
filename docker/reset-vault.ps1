$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$previousPreference = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping secure stack containers..."
docker compose -f docker-compose.secure.yml down *> $null

Write-Host "Removing vault-data volume..."
docker volume rm vault-data *> $null
docker volume create vault-data *> $null

$ErrorActionPreference = $previousPreference

if (Test-Path "vault-keys.json") {
    Remove-Item "vault-keys.json"
}

Write-Host "Starting secure stack..."
docker compose -f docker-compose.secure.yml up -d

if ($LASTEXITCODE -ne 0) {
    throw "Failed to restart secure stack"
}

Write-Host "Vault volume reset. Run .\init-vault.ps1 to initialize Vault."
