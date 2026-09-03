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

Stop-OtherStack -ComposeFile "docker-compose.secure.yml"
Ensure-Volume -Name "mongodb-data"
Remove-StandaloneContainer -ContainerName "mongodb"

Write-Host "Starting simple dev stack (MongoDB without auth, no Vault)..."
docker compose -f docker-compose.yml up -d

if ($LASTEXITCODE -ne 0) {
    throw "docker compose up failed"
}

Write-Host ""
Write-Host "Simple mode is running:"
Write-Host "  MongoDB: mongodb://localhost:27017"
Write-Host ""
Write-Host "Start the Python API with:"
Write-Host '  $env:APP_MODE = "simple"'
Write-Host "  cd ..\python-api"
Write-Host "  python main.py"
Write-Host ""
Write-Host "Check status:"
Write-Host "  docker compose -f docker-compose.yml ps"
