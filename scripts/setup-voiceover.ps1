# Starts Kokoro-FastAPI, the local text-to-speech server the clip editor's
# "Voiceover from script" panel speaks through (http://localhost:8880/v1).
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-voiceover.ps1
#
# Runs natively on the CPU - no Docker. Needs uv and eSpeak NG:
#   winget install --id astral-sh.uv -e
#   winget install --id eSpeak-NG.eSpeak-NG -e
#
# Everything lands outside the repo, under D:\AI_STUDIO\tools\kokoro-fastapi - beside the API's
# DataRoot (appsettings.json), so none of it fills C:. The first run downloads the Python packages and the model (~2-3 GB). Later runs reuse that
# install and reinstall only when $commit below changes - into the same .venv, deleting the
# downloads afterwards, so nothing piles up. By default the server runs in the background until
# you sign out or reboot; run this script again to start it.
#
# An install made before the switch to our fork is moved onto it the next time this runs; stop a
# Kokoro that is already running first, or this script just reports it and exits.
#
# -Foreground runs the server in this console instead, so closing the window stops it. run.bat
# starts it that way, in its own tab next to the backend and frontend.
param(
    [string]$InstallDir = 'D:\AI_STUDIO\tools\kokoro-fastapi',
    [string]$EspeakLibrary = 'C:\Program Files\eSpeak NG\libespeak-ng.dll',
    [switch]$Foreground
)

$ErrorActionPreference = 'Stop'

# Our fork, pinned, so a new upstream release can't change voices or the API under us. The fork
# adds DELETE /dev/tune/{voice}, which removes a user's tuned voice when they delete it.
$repo = 'https://github.com/keshavsingh3197/Kokoro-FastAPI.git'
$commit = 'c9cfeb262817bf3aabdf2cda3d3f892d82f222b0'
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
    Step "Cloning Kokoro-FastAPI into $InstallDir"
    New-Item -ItemType Directory -Force (Split-Path $InstallDir) | Out-Null
    Invoke-Checked 'Cloning Kokoro-FastAPI' { git clone --quiet --depth 1 $repo $InstallDir }
}
# Also moves an older install (upstream v0.2.4) onto the fork. Untracked files - the venv, the
# model, and voices tuned from users' samples - are left where they are.
if ((git -C $InstallDir rev-parse HEAD) -ne $commit) {
    Step "Moving Kokoro-FastAPI to $($commit.Substring(0, 7))"
    Invoke-Checked 'Pointing at the fork' { git -C $InstallDir remote set-url origin $repo }
    Invoke-Checked 'Fetching Kokoro-FastAPI' { git -C $InstallDir fetch --quiet --depth 1 origin $commit }
    Invoke-Checked 'Checking out Kokoro-FastAPI' { git -C $InstallDir checkout --quiet --force --detach FETCH_HEAD }
    # Drops the previous commit's objects, which the reflog would otherwise keep.
    Invoke-Checked 'Expiring the reflog' { git -C $InstallDir reflog expire --expire=now --all }
    Invoke-Checked 'Removing the previous commit' { git -C $InstallDir gc --quiet --prune=now }
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
    # "My voice": the API tunes a Kokoro voice from the user's sample and keeps it. Safe only
    # because the server listens on localhost and the API is its one caller.
    $env:ENABLE_INNO_TUNER = 'true'
    $env:ALLOW_LOCAL_VOICE_SAVING = 'true'
    # Kokoro's own uv cache, beside the install so it's on the same drive: uv hardlinks packages
    # from it into .venv, so the two share the space instead of holding two copies of torch.
    $env:UV_CACHE_DIR = Join-Path (Split-Path $InstallDir) 'uv-cache'

    if (-not (Test-Path '.venv\Scripts\python.exe')) {
        Step 'Creating the Python environment (uv fetches Python 3.10 if needed)'
        Invoke-Checked 'Creating the environment' { uv venv --python 3.10 .venv }
    }
    # Marked only once the install succeeds: an interrupted install leaves python.exe behind
    # with no packages, and must be retried rather than mistaken for a finished one. It names
    # the commit, so moving to a new one installs that commit's packages.
    $installed = '.venv\.animstudio-installed'
    if (-not (Test-Path $installed) -or (Get-Content $installed -Raw).Trim() -ne $commit) {
        Step 'Installing Kokoro-FastAPI (CPU build) - the first time downloads ~2 GB'
        Invoke-Checked 'Installing Kokoro-FastAPI' { uv pip install -e ".[cpu]" }
        Set-Content -Path $installed -Value $commit -Encoding utf8
        # .venv keeps its hardlinked files, so this frees only what nothing uses any more - the
        # packages an earlier commit installed. Kept when the install fails, so a retry resumes.
        Step 'Deleting the downloaded packages'
        Invoke-Checked 'Cleaning the uv cache' { uv cache clean }
    }
    # The voice tuner's weights came with the fork, so an older install has the model without them.
    if (-not (Test-Path 'api\src\models\v1_0\*.pth') -or -not (Test-Path 'api\src\models\v1_0\inno_tuner\model.safetensors')) {
        Step 'Downloading the Kokoro model and voice tuner'
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
