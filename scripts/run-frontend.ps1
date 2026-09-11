param(
    [Parameter(Mandatory = $true)][string]$ProjectDir,
    [Parameter(Mandatory = $true)][string]$LogFile
)

Set-Location $ProjectDir
Write-Host "[AnimStudio] Starting frontend: npm start" -ForegroundColor Cyan
Write-Host "[AnimStudio] Logging to: $LogFile" -ForegroundColor Cyan

& npm start 2>&1 | Tee-Object -FilePath $LogFile
