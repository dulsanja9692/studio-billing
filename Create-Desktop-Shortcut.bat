@echo off
title Creating Desktop Shortcut...
cd /d "%~dp0"

echo Creating Desktop shortcut for Godage Studio Billing...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $desktop = [Environment]::GetFolderPath('Desktop'); ^
   $s = $ws.CreateShortcut(\"$desktop\Godage Studio Billing.lnk\"); ^
   $s.TargetPath = \"$((Get-Item .).FullName)\Start-Billing-System.bat\"; ^
   $s.WorkingDirectory = \"$((Get-Item .).FullName)\"; ^
   $s.Description = \"Launch Godage Studio Billing System\"; ^
   $s.Save();"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Shortcut "Godage Studio Billing" created on your Desktop!
    echo You can now double-click it directly from your Desktop to start the app.
) else (
    echo [ERROR] Could not create shortcut. You can right-click Start-Billing-System.bat and choose "Send to > Desktop".
)

echo.
pause
