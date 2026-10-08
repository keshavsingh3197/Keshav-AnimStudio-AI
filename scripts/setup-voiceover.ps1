# Starts Kokoro-FastAPI, the local text-to-speech server the clip editor's
# "Voiceover from script" panel speaks through (http://localhost:8880/v1).
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-voiceover.ps1
#
# Runs natively on the CPU - no Docker. Needs uv and eSpeak NG:
#   winget install --id astral-sh.uv -e
#   winget install --id eSpeak-NG.eSpeak-NG -e
#
# Everything lands outside the repo, under %LOCALAPPDATA%\AnimStudio\kokoro-fastapi. The first
# run downloads the Python packages and the model (~2-3 GB). By default the server runs in the
# background until you sign out or reboot; run this script again to start it.
#
# -Foreground runs the server in this console instead, so closing the window stops it. run.bat
# starts it that way, in its own tab next to the backend and frontend.
param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'AnimStudio\kokoro-fastapi'),
    [string]$EspeakLibrary = 'C:\Program Files\eSpeak NG\libespeak-ng.dll',
    [switch]$Foreground
)

$ErrorActionPreference = 'Stop'

# Pinned, so a new upstream release can't change voices or the API under us.
$tag = 'v0.2.4'
$port = 8880
$voicesUrl = "http://localhost:$port/v1/audio/voices"

function Step($text) { Write-Host "[voiceover] $text" -ForegroundColor Cyan }

# A failing uv or git doesn't stop PowerShell by itself, so every call is checked.
function Invoke-Checked([string]$what, [scriptblock]$command) {
    & $command
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)." }
}

function Test-Kokoro {
    try { Invoke-RestMethod -Uri $voicesUrl -TimeoutSec 3 | Out-Null; return $true } catch { return $false }
}

if (Test-Kokoro) {
    Write-Host "Kokoro is already running on http://localhost:$port."
    exit 0
}

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw 'uv is not installed. Run: winget install --id astral-sh.uv -e   then open a new terminal.'
}
if (-not (Test-Path $EspeakLibrary)) {
    throw "eSpeak NG not found at '$EspeakLibrary'. Run: winget install --id eSpeak-NG.eSpeak-NG -e"
}

if (-not (Test-Path (Join-Path $InstallDir '.git'))) {
    Step "Cloning Kokoro-FastAPI $tag into $InstallDir"
    New-Item -ItemType Directory -Force (Split-Path $InstallDir) | Out-Null
    Invoke-Checked 'Cloning Kokoro-FastAPI' { git clone --quiet --branch $tag --depth 1 https://github.com/remsky/Kokoro-FastAPI.git $InstallDir }
}

Push-Location $InstallDir
try {
    # Same environment as upstream's start-cpu.ps1; child processes inherit it.
    $env:PHONEMIZER_ESPEAK_LIBRARY = $EspeakLibrary
    $env:PYTHONUTF8 = '1'
    $env:PROJECT_ROOT = $InstallDir
    $env:USE_GPU = 'false'
    $env:USE_ONNX = 'false'
    $env:PYTHONPATH = "$InstallDir;$InstallDir/api"
    $env:MODEL_DIR = 'src/models'
    $env:VOICES_DIR = 'src/voices/v1_0'
    $env:WEB_PLAYER_PATH = "$InstallDir/web"

    if (-not (Test-Path '.venv\Scripts\python.exe')) {
        Step 'Creating the Python environment (uv fetches Python 3.10 if needed)'
        Invoke-Checked 'Creating the environment' { uv venv --python 3.10 .venv }
    }
    # Marked only once the install succeeds: an interrupted install leaves python.exe behind
    # with no packages, and must be retried rather than mistaken for a finished one.
    $installed = '.venv\.animstudio-installed'
    if (-not (Test-Path $installed)) {
        Step 'Installing Kokoro-FastAPI (CPU build) - the first time downloads ~2 GB'
        Invoke-Checked 'Installing Kokoro-FastAPI' { uv pip install -e ".[cpu]" }
        Set-Content -Path $installed -Value (Get-Date -Format o) -Encoding utf8
    }
    if (-not (Test-Path 'api\src\models\v1_0\*.pth')) {
        Step 'Downloading the Kokoro model'
        Invoke-Checked 'Downloading the model' { uv run --no-sync python docker/scripts/download_model.py --output api/src/models/v1_0 }
    }

    # Bound to localhost only: the API is the one caller, nothing else should reach it.
    $serve = 'run', '--no-sync', 'uvicorn', 'api.src.main:app', '--host', '127.0.0.1', '--port', "$port"

    if ($Foreground) {
        Step "Starting Kokoro on http://localhost:$port - close this window or press Ctrl+C to stop it"
        & uv @serve
        exit $LASTEXITCODE
    }

    Step 'Starting Kokoro in the background'
    $logOut = Join-Path $InstallDir 'kokoro.log'
    $logErr = Join-Path $InstallDir 'kokoro.err.log'
    Start-Process -FilePath 'uv' -WindowStyle Hidden -ArgumentList $serve `
        -RedirectStandardOutput $logOut -RedirectStandardError $logErr | Out-Null
}
finally {
    Pop-Location
}

Write-Host 'Waiting for Kokoro to answer...'
for ($i = 0; $i -lt 60; $i++) {
    if (Test-Kokoro) {
        Write-Host "Kokoro is ready on http://localhost:$port. Restart the AnimStudio API if it was already running."
        exit 0
    }
    Start-Sleep -Seconds 3
}
throw "Kokoro did not start. Check: $logErr"
