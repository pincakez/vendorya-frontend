@echo off
setlocal enabledelayedexpansion

title Vendorya - QZ Tray Setup

REM ── Self-elevate: writing into C:\Program Files needs Administrator ──────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  Requesting Administrator rights...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  ============================================
echo   Vendorya - QZ Tray Printer Setup
echo  ============================================
echo.
echo  This will configure QZ Tray to permanently
echo  trust Vendorya on this computer.
echo.

REM ── Step 1: Locate the QZ Tray install folder ───────────────────────────────
echo  [1/5] Finding QZ Tray installation...
set "QZ_DIR="
for %%P in (
    "%PROGRAMFILES%\QZ Tray"
    "%PROGRAMFILES(X86)%\QZ Tray"
    "%LOCALAPPDATA%\Programs\QZ Tray"
    "%LOCALAPPDATA%\QZ Tray"
) do (
    if exist "%%~P\qz-tray.exe" (
        if not defined QZ_DIR set "QZ_DIR=%%~P"
    )
)

if not defined QZ_DIR (
    echo.
    echo  ERROR: Could not find QZ Tray. Install it first from:
    echo    https://vendorya.gatesinnov.com/downloads/qz-tray-2.2.6.exe
    echo.
    pause
    exit /b 1
)
echo        Found: %QZ_DIR%
echo.

REM ── Step 2: Stop QZ Tray if running ─────────────────────────────────────────
echo  [2/5] Stopping QZ Tray...
taskkill /f /im "qz-tray.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo        Done.
echo.

REM ── Step 3: Download Vendorya's trust certificate into the install folder ────
echo  [3/5] Installing Vendorya trust certificate...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try {" ^
    "  Invoke-WebRequest -Uri 'https://vendorya.gatesinnov.com/downloads/vendorya-qztray-cert.pem' -OutFile '%QZ_DIR%\override.crt' -UseBasicParsing;" ^
    "  Write-Host '       Saved: %QZ_DIR%\override.crt';" ^
    "} catch {" ^
    "  Write-Host '       ERROR: Could not download certificate. Check internet.'; exit 1;" ^
    "}"
if %errorlevel% neq 0 ( echo. & pause & exit /b 1 )
echo.

REM ── Step 4: Write qz-tray.properties (forward slashes — Java escapes '\') ────
echo  [4/5] Writing QZ Tray configuration...
set "QZ_DIR_FWD=%QZ_DIR:\=/%"
> "%QZ_DIR%\qz-tray.properties" echo authcert.override=%QZ_DIR_FWD%/override.crt
>> "%QZ_DIR%\qz-tray.properties" echo security.allow-unsigned=true
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Could not write config to %QZ_DIR%.
    echo  Make sure you ran this as Administrator.
    echo.
    pause
    exit /b 1
)
echo        Saved: %QZ_DIR%\qz-tray.properties
echo.

REM ── Step 5: Start QZ Tray ───────────────────────────────────────────────────
echo  [5/5] Starting QZ Tray...
start "" "%QZ_DIR%\qz-tray.exe"
echo        Started.
echo.

echo  ============================================
echo   Setup complete!
echo.
echo   Next time you print from Vendorya, the QZ
echo   Tray popup will let you pick "Allow all the
echo   time" (no longer greyed out). Click it once
echo   and you are set forever on this PC.
echo.
echo   If a print test fails, check that the printer
echo   name matches exactly what appears in Windows
echo   "Devices and Printers".
echo  ============================================
echo.
pause
