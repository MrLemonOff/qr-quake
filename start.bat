@echo off
setlocal
cd /d "%~dp0"
title QR Quake

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Opening the download page...
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, this takes a minute the first time...
  call npm ci
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)

echo Starting QR Quake. Close this window to stop it.
call npm run dev -- --open
pause
