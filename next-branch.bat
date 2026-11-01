@echo off
setlocal enabledelayedexpansion

REM ===== Commit Message =====
set /p MSG=Enter commit message:

REM ===== Get Current Branch =====
for /f %%i in ('git branch --show-current') do set CURBRANCH=%%i

echo Current Branch: %CURBRANCH%

REM ===== Commit & Push =====
git add .

git commit -m "%MSG%"

git push origin %CURBRANCH%

REM ===== Switch to master =====
git checkout master
git pull

REM ===== Determine Next Anim Number =====
set NUM=1

for /f %%i in ('git branch -a ^| findstr /R "Anim[0-9][0-9][0-9]$"') do (
    set BRANCH=%%i
)

for /f "tokens=2 delims=m" %%a in ("!BRANCH!") do set NUMSTR=%%a

set /a NUM=!NUMSTR!+1

if !NUM! LSS 10 (
    set NEXT=Anim00!NUM!
) else if !NUM! LSS 100 (
    set NEXT=Anim0!NUM!
) else (
    set NEXT=Anim!NUM!
)

echo Creating Branch !NEXT!

git checkout -b !NEXT!

echo.
echo ==================================
echo Now working on branch !NEXT!
echo ==================================
pause