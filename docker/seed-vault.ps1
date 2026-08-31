$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$keysFile = Join-Path $PSScriptRoot "vault-keys.json"
if (-not (Test-Path $keysFile)) {
    throw "vault-keys.json not found. Run .\init-vault.ps1 first."
}

$vaultToken = (Get-Content $keysFile | ConvertFrom-Json).root_token
$vaultAddress = "http://127.0.0.1:8201"
$mongoUri = "mongodb://app_user:app_password@127.0.0.1:27017/react_vite_app?authSource=react_vite_app"

$previousPreference = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

docker exec -e VAULT_ADDR=$vaultAddress -e VAULT_TOKEN=$vaultToken vault vault secrets enable -path=secret kv-v2 *> $null

$output = docker exec `
    -e VAULT_ADDR=$vaultAddress `
    -e VAULT_TOKEN=$vaultToken `
    vault vault kv put secret/mongodb `
    uri=$mongoUri `
    username=app_user `
    password=app_password `
    database=react_vite_app 2>&1

$ErrorActionPreference = $previousPreference

if ($LASTEXITCODE -ne 0) {
    throw "Failed to store MongoDB credentials in Vault: $output"
}

Write-Host "Stored MongoDB credentials at secret/mongodb"
