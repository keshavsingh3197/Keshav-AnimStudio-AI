# Starts Kokoro-FastAPI, the local text-to-speech server the clip editor's
# "Voiceover from script" panel speaks through (http://localhost:8880/v1).
#
#   .\scripts\setup-voiceover.ps1          # CPU image
#   .\scripts\setup-voiceover.ps1 -Gpu     # NVIDIA GPU image
#
# Needs Docker Desktop. The container restarts with Docker, so this is a one-time step.
param([switch]$Gpu)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is not installed. Install Docker Desktop, then run this script again.'
}
docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is not running. Start it, wait for "Engine running", then run this script again.'
}

# Pinned, so a new upstream release can't change voices or the API under us.
$tag   = 'v0.2.4'
$image = if ($Gpu) { "ghcr.io/remsky/kokoro-fastapi-gpu:$tag" } else { "ghcr.io/remsky/kokoro-fastapi-cpu:$tag" }
$name  = 'animstudio-kokoro'

$existing = docker ps -a --filter "name=^$name$" --format '{{.Names}}'
if ($existing) {
    Write-Host "Starting existing $name container..."
    docker start $name | Out-Null
} else {
    Write-Host "Pulling $image (first run downloads ~2-5 GB)..."
    $gpuArgs = if ($Gpu) { @('--gpus', 'all') } else { @() }
    # Bound to localhost only: the API is the one caller, nothing else should reach it.
    docker run -d --name $name --restart unless-stopped @gpuArgs -p 127.0.0.1:8880:8880 $image | Out-Null
}

Write-Host 'Waiting for Kokoro to answer...'
for ($i = 0; $i -lt 60; $i++) {
    try {
        Invoke-RestMethod -Uri 'http://localhost:8880/v1/audio/voices' -TimeoutSec 3 | Out-Null
        Write-Host 'Kokoro is ready on http://localhost:8880. Restart the AnimStudio API if it was already running.'
        exit 0
    } catch {
        Start-Sleep -Seconds 3
    }
}
throw "Kokoro did not start. Check: docker logs $name"
