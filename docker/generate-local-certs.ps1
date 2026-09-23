# Generate a local self-signed TLS cert for prod-compose HTTPS testing.
# Requires Docker. Output: docker/certs/fullchain.pem and privkey.pem (gitignored).

$ErrorActionPreference = "Stop"
$certsDir = Join-Path $PSScriptRoot "certs"

New-Item -ItemType Directory -Force -Path $certsDir | Out-Null

Write-Host "Generating self-signed cert for localhost into $certsDir ..."

docker run --rm `
  -v "${certsDir}:/certs" `
  alpine/openssl `
  req -x509 -nodes -newkey rsa:2048 -days 825 `
  -keyout /certs/privkey.pem `
  -out /certs/fullchain.pem `
  -subj "/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

Write-Host "Done. Trust the cert in your OS/browser if prompted, then open https://localhost"
