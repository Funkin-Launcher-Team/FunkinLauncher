@echo off
setlocal

:menu
cls
echo Select a mode:
echo 1. Run app without Ignore Updates flag
echo 2. Run app with Ignore Updates flag
echo 3. Exit

set /p choice=Enter your choice: 

if "%choice%"=="1" (
    electron .
    pause
    goto menu
) else if "%choice%"=="2" (
    electron . --nfu
    pause
    goto menu
) else if "%choice%"=="3" (
    exit /b
) else (
    goto menu
)