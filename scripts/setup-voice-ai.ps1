# Installs the local AI voice converter (Seed-VC) used by "AI voice" characters.
#
# Everything lands outside the repo, under %LOCALAPPDATA%\AnimStudio\seed-vc, and runs on the
# CPU - no GPU, no cloud. Versions are pinned so a reinstall gives the same converter. Seed-VC
# is GPL-3.0; AnimStudio only runs it as a separate program and never ships it.
#
# The model weights (about 2 GB) download from HuggingFace on the first conversion, not here.
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-voice-ai.ps1

param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'AnimStudio\seed-vc'),
    [string]$Python = 'python'
)

$ErrorActionPreference = 'Stop'

# The commit this integration was written and tested against.
$SeedVcCommit = '51383efd921027683c89e5348211d93ff12ac2a8'

function Step($text) { Write-Host "[voice-ai] $text" -ForegroundColor Cyan }

# A failing pip or python doesn't stop PowerShell by itself, so every call is checked.
function Invoke-Checked([string]$what, [scriptblock]$command) {
    & $command
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)." }
}

$version = & $Python -c "import sys; print('%d.%d' % sys.version_info[:2])"
if ($version -ne '3.10' -and $version -ne '3.11') {
    throw "Seed-VC needs Python 3.10 or 3.11; '$Python' is $version."
}

if (-not (Test-Path (Join-Path $InstallDir '.git'))) {
    Step "Cloning Seed-VC into $InstallDir"
    New-Item -ItemType Directory -Force (Split-Path $InstallDir) | Out-Null
    Invoke-Checked 'Cloning Seed-VC' { git clone --quiet https://github.com/Plachtaa/seed-vc.git $InstallDir }
}
Step "Pinning Seed-VC to $SeedVcCommit"
Invoke-Checked 'Fetching Seed-VC' { git -C $InstallDir fetch --quiet origin }
Invoke-Checked 'Pinning Seed-VC' { git -C $InstallDir checkout --quiet $SeedVcCommit }

$venv = Join-Path $InstallDir '.venv'
if (-not (Test-Path (Join-Path $venv 'Scripts\python.exe'))) {
    Step 'Creating the Python environment'
    Invoke-Checked 'Creating the environment' { & $Python -m venv $venv }
}
$py = Join-Path $venv 'Scripts\python.exe'

# 2.4.1, not Seed-VC's 2.4.0: the 2.4.0 Windows build needs libomp140.x86_64.dll, which most
# machines don't have, and fails to load with "Error loading fbgemm.dll". 2.4.1 bundles it.
Step 'Installing PyTorch (CPU build)'
Invoke-Checked 'Updating pip' { & $py -m pip install --quiet --upgrade pip==24.2 }
Invoke-Checked 'Installing PyTorch' { & $py -m pip install --quiet torch==2.4.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cpu }

Step 'Installing what the converter needs (pinned)'
Invoke-Checked 'Installing the converter''s packages' {
    & $py -m pip install --quiet `
        numpy==1.26.4 scipy==1.13.1 librosa==0.10.2 soundfile==0.12.1 pydub==0.25.1 `
        huggingface-hub==0.28.1 transformers==4.46.3 munch==4.0.0 einops==0.8.0 `
        descript-audio-codec==1.0.0 hydra-core==1.3.2 pyyaml==6.0.2 accelerate==1.1.1
}

Step 'Checking the install'
Invoke-Checked 'Loading PyTorch' { & $py -c "import torch, torchaudio, librosa, transformers; print('torch', torch.__version__, '| threads', torch.get_num_threads())" }

Write-Host ''
Write-Host "[voice-ai] Ready. Point the API at it (appsettings or user-secrets):" -ForegroundColor Green
Write-Host "  VoiceConversion:Enabled    = true"
Write-Host "  VoiceConversion:PythonPath = $py"
Write-Host "  VoiceConversion:SeedVcPath = $InstallDir"
