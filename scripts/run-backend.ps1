param(
    [Parameter(Mandatory = $true)][string]$ProjectDir,
    [Parameter(Mandatory = $true)][string]$LogFile
)

Set-Location $ProjectDir
Write-Host "[AnimStudio] Starting backend: dotnet run" -ForegroundColor Cyan
Write-Host "[AnimStudio] Logging to: $LogFile" -ForegroundColor Cyan

& dotnet run 2>&1 | Tee-Object -FilePath $LogFile
