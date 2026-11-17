@echo off
title Creating Desktop Shortcut...
cd /d "%~dp0"

echo ========================================================
echo        GODAGE STUDIO - DESKTOP SHORTCUT CREATOR
echo ========================================================
echo.
echo Creating Desktop shortcut for Godage Studio Billing...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Shortcut "Godage Studio Billing" created on your Desktop!
    echo You can now double-click it directly from your Desktop to start the app.
    echo ========================================================
) else (
    echo.
    echo [ERROR] Could not create shortcut automatically.
    echo Alternative: Right-click "Start-Billing-System.bat" and select "Send to > Desktop (create shortcut)".
)

echo.
pause
