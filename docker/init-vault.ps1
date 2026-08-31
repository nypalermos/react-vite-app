$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$keysFile = Join-Path $PSScriptRoot "vault-keys.json"
$vaultAddress = "http://127.0.0.1:8201"

function Invoke-VaultCli {
    param (
        [Parameter(Mandatory = $true)]
        [string[]]$Command
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    try {
        $output = docker exec -e VAULT_ADDR=$vaultAddress vault vault @Command 2>&1
        return @{
            ExitCode = $LASTEXITCODE
            Output   = ($output | Out-String).Trim()
        }
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Wait-ForVault {
    Write-Host "Waiting for Vault to become available..."
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $result = Invoke-VaultCli -Command @("status", "-format=json")
        if ($result.ExitCode -eq 0 -or $result.ExitCode -eq 2) {
            return
        }

        Write-Host "  Vault not ready yet (attempt $attempt/30)..."
        Start-Sleep -Seconds 2
    }

    throw "Vault did not become available in time."
}

function Get-VaultStatus {
    $result = Invoke-VaultCli -Command @("status", "-format=json")
    if ($result.ExitCode -ne 0 -and $result.ExitCode -ne 2) {
        return $null
    }

    if (-not $result.Output) {
        return $null
    }

    return $result.Output | ConvertFrom-Json
}

Wait-ForVault

$status = Get-VaultStatus
if ($status -and $status.initialized -and -not $status.sealed) {
    Write-Host "Vault is already initialized and unsealed."
    exit 0
}

if (Test-Path $keysFile) {
    Write-Host "Found existing vault-keys.json. Attempting to unseal..."
    $saved = Get-Content $keysFile | ConvertFrom-Json

    Invoke-VaultCli -Command @("operator", "unseal", $saved.unseal_keys[0]) | Out-Null

    $status = Get-VaultStatus
    if ($status -and -not $status.sealed) {
        Write-Host "Vault unsealed successfully."
        exit 0
    }
}

if ($status -and $status.initialized) {
    throw @"
Vault is initialized but sealed, and vault-keys.json is missing or invalid.
Run .\reset-vault.ps1 to recreate the Vault volume, then run .\init-vault.ps1 again.
"@
}

Write-Host "Initializing Vault for the first time..."
$initResult = Invoke-VaultCli -Command @(
    "operator",
    "init",
    "-key-shares=1",
    "-key-threshold=1",
    "-format=json"
)

if ($initResult.Output -match "already initialized") {
    throw @"
Vault is already initialized in the vault-data volume.
Run .\reset-vault.ps1 to recreate the Vault volume, then run .\init-vault.ps1 again.
"@
}

if ($initResult.ExitCode -ne 0 -or -not $initResult.Output) {
    throw "Vault init failed: $($initResult.Output)"
}

$init = $initResult.Output | ConvertFrom-Json
$keys = [ordered]@{
    root_token  = $init.root_token
    unseal_keys = $init.unseal_keys_b64
}
$keys | ConvertTo-Json | Set-Content $keysFile

Invoke-VaultCli -Command @("operator", "unseal", $init.unseal_keys_b64[0]) | Out-Null

Write-Host ""
Write-Host "Vault initialized and unsealed."
Write-Host "Root token and unseal key saved to vault-keys.json (gitignored)."
Write-Host "Vault UI: http://localhost:8200"
