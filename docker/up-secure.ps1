$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

function Ensure-Volume {
    param (
        [string]$Name
    )

    $volumeExists = docker volume ls -q --filter "name=^${Name}$"
    if (-not $volumeExists) {
        Write-Host "Creating Docker volume '$Name'..."
        docker volume create $Name | Out-Null
    }
}

function Stop-OtherStack {
    param (
        [string]$ComposeFile
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        docker compose -f $ComposeFile down *> $null
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Remove-StandaloneContainer {
    param (
        [string]$ContainerName
    )

    $existingId = docker ps -aq --filter "name=^/${ContainerName}$"
    if ($existingId) {
        $labels = docker inspect $existingId --format '{{json .Config.Labels}}' | ConvertFrom-Json
        if (-not $labels.'com.docker.compose.project') {
            Write-Host "Removing existing standalone '$ContainerName' container..."
            docker rm -f $ContainerName | Out-Null
        }
    }
}

Stop-OtherStack -ComposeFile "docker-compose.yml"
Ensure-Volume -Name "mongodb-secure-data"
Ensure-Volume -Name "vault-data"
Remove-StandaloneContainer -ContainerName "mongodb"
Remove-StandaloneContainer -ContainerName "vault"

Write-Host "Starting secure dev stack (MongoDB with auth + Vault)..."
docker compose -f docker-compose.secure.yml up -d

if ($LASTEXITCODE -ne 0) {
    throw "docker compose up failed"
}

function Test-VaultReady {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    try {
        docker exec -e VAULT_ADDR=http://127.0.0.1:8201 vault vault status *> $null
        return ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 2)
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

Write-Host "Waiting for Vault to become available..."
$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    if (Test-VaultReady) {
        $ready = $true
        break
    }

    Write-Host "  Vault not ready yet (attempt $attempt/30)..."
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    throw "Vault did not become available in time"
}

& "$PSScriptRoot\init-vault.ps1"
& "$PSScriptRoot\seed-vault.ps1"

Write-Host ""
Write-Host "Secure mode is running:"
Write-Host "  MongoDB: authenticated (app_user)"
Write-Host "  Vault:   http://localhost:8200"
Write-Host ""
Write-Host "Start the Python API with:"
Write-Host '  $env:APP_MODE = "secure"'
Write-Host '  $env:VAULT_TOKEN = (Get-Content .\vault-keys.json | ConvertFrom-Json).root_token'
Write-Host "  cd ..\python-api"
Write-Host "  python main.py"
Write-Host ""
Write-Host "Check status:"
Write-Host "  docker compose -f docker-compose.secure.yml ps"
