# Installs whisper.cpp, the local speech-to-text engine behind "Speak it" in the clip editor's
# Voiceover panel (the whispercpp-local provider).
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-dictation.ps1
#
# Runs natively on the CPU - no Docker, no Python, nothing to keep running: the API starts
# whisper-cli for each recording. Everything lands under D:\AI_STUDIO\tools\whisper-cpp, beside
# the API's DataRoot (appsettings.json), so none of it fills C:. The first run downloads the
# program (~5 MB) and the model (~470 MB); later runs find them and only check them.
#
# The model is the multilingual "small" one: it hears Hindi as well as English. "base" is
# quicker but weak on Hindi; "*.en" models are English only.
param(
    [string]$InstallDir = 'D:\AI_STUDIO\tools\whisper-cpp',
    [ValidateSet('ggml-base', 'ggml-small', 'ggml-medium')]
    [string]$Model = 'ggml-small'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is many times slower with the progress bar.

# Pinned, so a new release can't change the program's flags under the API.
$release = 'b5454'
$binaryUrl = "https://github.com/ggml-org/whisper.cpp/releases/download/$release/whisper-bin-x64.zip"
$modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$Model.bin"

function Step($message) { Write-Host "==> $message" -ForegroundColor Cyan }

$binDir = Join-Path $InstallDir 'bin'
$modelsDir = Join-Path $InstallDir 'models'
New-Item -ItemType Directory -Force -Path $binDir, $modelsDir | Out-Null

$marker = Join-Path $binDir ".release-$release"
$cli = Get-ChildItem -Path $binDir -Recurse -Filter 'whisper-cli.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $cli -or -not (Test-Path $marker)) {
    Step "Downloading whisper.cpp $release"
    $zip = Join-Path $InstallDir "whisper-bin-x64-$release.zip"
    Invoke-WebRequest -Uri $binaryUrl -OutFile $zip
    Get-ChildItem -Path $binDir -Force | Remove-Item -Recurse -Force
    Expand-Archive -Path $zip -DestinationPath $binDir -Force
    Remove-Item $zip -Force
    $cli = Get-ChildItem -Path $binDir -Recurse -Filter 'whisper-cli.exe' | Select-Object -First 1
    if (-not $cli) { throw "whisper-cli.exe was not in the $release download." }
    New-Item -ItemType File -Force -Path $marker | Out-Null
} else {
    Step "whisper.cpp $release is already installed"
}

$modelFile = Join-Path $modelsDir "$Model.bin"
if (-not (Test-Path $modelFile) -or (Get-Item $modelFile).Length -lt 50MB) {
    Step "Downloading the $Model model (this is the big one)"
    $partial = "$modelFile.partial"
    Invoke-WebRequest -Uri $modelUrl -OutFile $partial
    Move-Item -Force $partial $modelFile
} else {
    Step "The $Model model is already downloaded"
}

Step 'Checking that it runs'
# --help prints to stderr, which Windows PowerShell turns into an error under 'Stop'.
$ErrorActionPreference = 'Continue'
& $cli.FullName --help *> $null
$exit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($exit -ne 0) { throw "whisper-cli.exe would not start (exit $exit). Install the latest Visual C++ Redistributable and try again." }

Write-Host ''
Write-Host 'Done. Add this to backend\AnimStudio.Api\appsettings.Development.json under Ai:Providers (already there in this repo):' -ForegroundColor Green
Write-Host @"
  "whispercpp-local": {
    "Enabled": true,
    "ExecutablePath": "$($cli.FullName.Replace('\', '/'))",
    "ModelsPath": "$($modelsDir.Replace('\', '/'))",
    "Model": "$Model"
  }
"@
Write-Host 'Then restart the API. If Admin > AI providers lists whispercpp-local, switch it on there too, with model' $Model '- saved settings win over the file.'
