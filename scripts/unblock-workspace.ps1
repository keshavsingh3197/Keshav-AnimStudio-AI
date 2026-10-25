<#
.SYNOPSIS
    Unblocks all binary and script files in the workspace to prevent Windows Smart App Control (SAC)
    and Defender "Application Control policy has blocked this file" (0x800711C7) errors.

.DESCRIPTION
    Windows Smart App Control flags files downloaded from the web or created by external tools
    by checking their NTFS "Zone.Identifier" alternate data stream. This script recursively removes
    Zone.Identifier streams from .dll, .exe, .node, and .ps1 files in the AnimStudio repository.
#>

$root = Resolve-Path "$PSScriptRoot\.."
Write-Host "[AnimStudio] Unblocking workspace files at: $root" -ForegroundColor Cyan

$extensions = @("*.dll", "*.exe", "*.node", "*.ps1")
$count = 0

foreach ($ext in $extensions) {
    Get-ChildItem -Path $root -Recurse -Filter $ext -File -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue
            $count++
        } catch {
            # Ignore read-only or in-use locks
        }
    }
}

Write-Host "[AnimStudio] Processed $count binary/script files across workspace." -ForegroundColor Green
Write-Host "[AnimStudio] If Windows SAC (Smart App Control) still blocks execution, you may need to add a Defender Exclusion for your workspace directory: $root" -ForegroundColor Yellow

