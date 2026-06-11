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
echo  [1/4] Finding QZ Tray installation...
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
echo  [2/4] Stopping QZ Tray...
taskkill /f /im "qz-tray.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo        Done.
echo.

REM ── Step 3: Download cert + MERGE authcert.override into qz-tray.properties ──
REM    IMPORTANT: we APPEND/UPDATE one line — never overwrite the file. QZ Tray
REM    keeps its own websocket keystore settings (wss.*) in this same file, and
REM    wiping them breaks QZ's secure connection. Forward slashes: Java Properties
REM    treats '\' as an escape char. Done in PowerShell so the merge is safe.
echo  [3/4] Installing Vendorya trust certificate + config...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $qz='%QZ_DIR%'; $cert=Join-Path $qz 'override.crt'; Invoke-WebRequest -Uri 'https://vendorya.gatesinnov.com/downloads/vendorya-qztray-cert.pem' -OutFile $cert -UseBasicParsing; $props=Join-Path $qz 'qz-tray.properties'; $fwd=$cert.Replace('\','/'); $old= if(Test-Path $props){@(Get-Content $props)} else {@()}; $keep=@($old | Where-Object { $_ -notmatch '^\s*authcert\.override' -and $_ -notmatch '^\s*security\.allow-unsigned' }); $out=$keep + ('authcert.override=' + $fwd); Set-Content -Path $props -Value $out -Encoding ASCII; Write-Host ('       Trusted cert: ' + $cert); Write-Host ('       Merged into: ' + $props)"
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Could not download cert or write config.
    echo  Check internet, and make sure you ran this as Administrator.
    echo.
    pause
    exit /b 1
)
echo.

REM ── Step 4: Start QZ Tray ───────────────────────────────────────────────────
echo  [4/4] Starting QZ Tray...
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
