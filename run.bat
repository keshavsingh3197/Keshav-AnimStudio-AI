@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  AnimStudio AI - Dev launcher
REM  Starts backend (dotnet run) and frontend (npm start) as two
REM  tabs in one Windows Terminal window (falls back to separate
REM  cmd windows if wt.exe isn't available), with timestamped
REM  logs for each.
REM ============================================================

set "ROOT=%~dp0"
set "LOG_DIR=%ROOT%logs"
set "API_PROJECT=%ROOT%backend\AnimStudio.Api"
set "FRONTEND_DIR=%ROOT%frontend"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Timestamp for this run (yyyyMMdd_HHmmss), locale-independent via wmic fallback
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do set "RAWTS=%%a%%b%%c%%d%%e%%f"
set "TS=%RAWTS: =0%"
set "BACKEND_LOG=%LOG_DIR%\backend_%TS%.log"
set "FRONTEND_LOG=%LOG_DIR%\frontend_%TS%.log"

echo ============================================================
echo  AnimStudio AI - starting dev environment
echo  Backend project : %API_PROJECT%
echo  Frontend project: %FRONTEND_DIR%
echo  Backend log     : %BACKEND_LOG%
echo  Frontend log     : %FRONTEND_LOG%
echo ============================================================

if not exist "%API_PROJECT%\AnimStudio.Api.csproj" (
    echo [ERROR] Backend project not found at "%API_PROJECT%"
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend project not found at "%FRONTEND_DIR%"
    pause
    exit /b 1
)

echo [INFO] Launching backend: dotnet run --project "%API_PROJECT%"
echo [INFO] Launching frontend: npm start

set "BACKEND_PS1=%ROOT%scripts\run-backend.ps1"
set "FRONTEND_PS1=%ROOT%scripts\run-frontend.ps1"
REM Kokoro (voiceover speech) runs in the foreground of its own tab, so closing the
REM window stops it along with the backend and frontend.
set "VOICE_PS1=%ROOT%scripts\setup-voiceover.ps1"

where wt.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    wt -w 0 new-tab --title "AnimStudio Voice" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File "%VOICE_PS1%" -Foreground ^
        ; new-tab --title "AnimStudio Backend" powershell -NoExit -NoProfile -File "%BACKEND_PS1%" -ProjectDir "%API_PROJECT%" -LogFile "%BACKEND_LOG%" ^
        ; new-tab --title "AnimStudio Frontend" powershell -NoExit -NoProfile -File "%FRONTEND_PS1%" -ProjectDir "%FRONTEND_DIR%" -LogFile "%FRONTEND_LOG%"
) else (
    echo [WARN] wt.exe not found, falling back to separate windows.
    start "AnimStudio Voice (Kokoro)" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File "%VOICE_PS1%" -Foreground
    start "AnimStudio Backend (dotnet run)" powershell -NoExit -NoProfile -File "%BACKEND_PS1%" -ProjectDir "%API_PROJECT%" -LogFile "%BACKEND_LOG%"
    start "AnimStudio Frontend (npm start)" powershell -NoExit -NoProfile -File "%FRONTEND_PS1%" -ProjectDir "%FRONTEND_DIR%" -LogFile "%FRONTEND_LOG%"
)

echo.
echo [INFO] Voice engine, backend and frontend launched (as Windows Terminal tabs if wt.exe is available).
echo [INFO] Close the tabs/windows (or Ctrl+C inside them) to stop the app.
echo [INFO] Logs are being written live to:
echo         %BACKEND_LOG%
echo         %FRONTEND_LOG%
echo.
pause

endlocal
