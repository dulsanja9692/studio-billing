$ErrorActionPreference = "SilentlyContinue"

$desktop = [Environment]::GetFolderPath('Desktop')
if (-not $desktop -or -not (Test-Path $desktop -ErrorAction SilentlyContinue)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
if (Test-Path (Join-Path $env:USERPROFILE 'OneDrive\Desktop') -ErrorAction SilentlyContinue) {
    $desktop = Join-Path $env:USERPROFILE 'OneDrive\Desktop'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

try {
    $ws = New-Object -ComObject WScript.Shell
    $shortcutPath = Join-Path $desktop "Godage Studio Billing.lnk"
    $s = $ws.CreateShortcut($shortcutPath)
    $s.TargetPath = Join-Path $scriptDir "Start-Billing-System.bat"
    $s.WorkingDirectory = $scriptDir
    $s.Description = "Launch Godage Studio Billing System"
    $s.Save()
    Write-Host "[OK] Desktop shortcut created successfully at: $shortcutPath"
    exit 0
} catch {
    Write-Host "[WARNING] Could not write shortcut directly to Desktop ($($_.Exception.Message))"
    exit 1
}
