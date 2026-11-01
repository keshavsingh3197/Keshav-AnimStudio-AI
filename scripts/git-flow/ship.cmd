@echo off
setlocal

REM ============================================================
REM  Windows launcher for ship.ps1 - commit, push, open a PR,
REM  wait for the merge, then switch to a fresh branch.
REM  Double-click it, or run:  ship.cmd -m "message" [options]
REM  Options: see ship.ps1 (Get-Help .\ship.ps1 -Detailed)
REM ============================================================

set "PS_EXE=powershell.exe"
where pwsh.exe >nul 2>nul && set "PS_EXE=pwsh.exe"

REM ExecutionPolicy applies to this one process only, so the script runs on machines that block
REM unsigned local scripts by default; nothing is changed system-wide.
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0ship.ps1" %*
set "RC=%ERRORLEVEL%"

REM Keep the window open when started by double-click from Explorer.
echo %CMDCMDLINE% | find /i "%~nx0" >nul && pause

exit /b %RC%
