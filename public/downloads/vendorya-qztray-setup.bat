@echo off
setlocal enabledelayedexpansion

title Vendorya - QZ Tray Setup

echo.
echo  ============================================
echo   Vendorya - QZ Tray Printer Setup
echo  ============================================
echo.
echo  This script will configure QZ Tray to work
echo  with Vendorya on this computer.
echo.

REM ── Step 1: Stop QZ Tray if running ─────────────────────────────────────
echo  [1/4] Stopping QZ Tray if it is running...
taskkill /f /im "qz-tray.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo        Done.
echo.

REM ── Step 2: Create config folder if it does not exist ───────────────────
echo  [2/4] Preparing config folder...
if not exist "%APPDATA%\qz" (
    mkdir "%APPDATA%\qz"
)
echo        Folder: %APPDATA%\qz
echo.

REM ── Step 3: Write the config (allow unsigned connections) ────────────────
echo  [3/4] Writing QZ Tray configuration...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$file = $env:APPDATA + '\qz\qz-tray.properties';" ^
    "if (Test-Path $file) {" ^
    "    $lines = Get-Content $file | Where-Object { $_ -notmatch '^security\.allow-unsigned' };" ^
    "} else {" ^
    "    $lines = @();" ^
    "};" ^
    "$lines += 'security.allow-unsigned=true';" ^
    "Set-Content -Path $file -Value $lines -Encoding UTF8;" ^
    "Write-Host '       Config saved to: ' $file"

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Could not write config file.
    echo  Try right-clicking this file and choosing "Run as administrator".
    echo.
    pause
    exit /b 1
)
echo.

REM ── Step 4: Start QZ Tray ───────────────────────────────────────────────
echo  [4/4] Starting QZ Tray...

set "QZ_EXE="

REM Search common install locations
for %%P in (
    "%PROGRAMFILES%\QZ Tray\qz-tray.exe"
    "%PROGRAMFILES(X86)%\QZ Tray\qz-tray.exe"
    "%LOCALAPPDATA%\qz-tray\qz-tray.exe"
    "%LOCALAPPDATA%\Programs\qz-tray\qz-tray.exe"
    "%LOCALAPPDATA%\QZ Tray\qz-tray.exe"
) do (
    if exist %%P (
        if not defined QZ_EXE set "QZ_EXE=%%P"
    )
)

if defined QZ_EXE (
    start "" %QZ_EXE%
    echo        Started from: %QZ_EXE%
) else (
    echo        QZ Tray not found in standard locations.
    echo        Please start QZ Tray manually from your desktop or Start menu.
)

echo.
echo  ============================================
echo   Setup complete!
echo.
echo   QZ Tray is now configured to connect to
echo   Vendorya automatically on this computer.
echo.
echo   If a printer test fails, make sure:
echo     1. QZ Tray is running (check system tray)
echo     2. The printer name matches exactly what
echo        appears in Windows Devices and Printers
echo  ============================================
echo.
pause
