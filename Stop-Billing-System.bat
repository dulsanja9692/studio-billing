@echo off
title Stopping Godage Studio Billing...
echo Stopping billing system on port 3000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo [OK] Billing system stopped.
pause
