@echo off
setlocal

set "ROOT=%~dp0"
echo ============================================================
echo  AnimStudio AI - Building Solution and Frontend
echo ============================================================

echo [1/2] Building .NET Backend and Tests...
dotnet build "%ROOT%AnimStudio.slnx"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] .NET build failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Building Angular Frontend...
call npm --prefix "%ROOT%frontend" run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo  [SUCCESS] Both .NET and Frontend builds completed cleanly.
echo ============================================================
endlocal
