@echo off
setlocal enabledelayedexpansion
title Godage Studio - Billing ^& POS System
color 0b

echo ========================================================
echo           GODAGE STUDIO - BILLING ^& POS SYSTEM
echo ========================================================
echo.

:: 1. Navigate to script directory (works anywhere it is placed)
cd /d "%~dp0"

:: 2. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not installed on this computer!
    echo Please download and install Node.js from https://nodejs.org/
    echo Then run this shortcut again.
    echo.
    pause
    exit /b 1
)

:: 3. Check for serviceAccountKey.json
if not exist "serviceAccountKey.json" (
    color 0c
    echo ========================================================
    echo [ERROR] serviceAccountKey.json was not found in this folder!
    echo ========================================================
    echo The billing system requires serviceAccountKey.json to
    echo connect to the Firebase Cloud Database.
    echo.
    echo Please copy serviceAccountKey.json into:
    echo %~dp0
    echo ========================================================
    echo.
    pause
    exit /b 1
)

:: 4. Check for .env.local
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Initializing .env.local configuration...
        copy ".env.example" ".env.local" >nul
    )
)

:: 5. Automatically free port 3000 if a previous session is still running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Releasing port 3000 from previous session (PID: %%a)...
    taskkill /f /pid %%a >nul 2>nul
)

:: 6. Check if packages are installed
if not exist "node_modules" (
    echo [INFO] First-time setup: Installing required packages...
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo [ERROR] Failed to install packages. Please check internet connection.
        pause
        exit /b 1
    )
)

:: 7. Check if build exists, if not build the app
if not exist ".next" (
    echo [INFO] First-time setup: Building billing system...
    call npm run build
    if %errorlevel% neq 0 (
        color 0c
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
)

:: 8. Get Local IP Address for LAN devices
set "LOCAL_IP=localhost"
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0.*0.0.0.0 2^>nul') do (
    if not "%%a"=="" set "LOCAL_IP=%%a"
)

echo.
echo ========================================================
echo [OK] Billing System is starting!
echo.
echo   * On this computer:  http://localhost:3000
echo   * Other shop devices: http://!LOCAL_IP!:3000
echo ========================================================
echo.
echo Opening your browser now...
echo (Keep this window open while using the billing system)
echo.

:: 9. Launch browser after a short 3-second delay in background
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 10. Start the Next.js server accessible across local network
call npx next start -H 0.0.0.0 -p 3000

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Server stopped.
    pause
)
