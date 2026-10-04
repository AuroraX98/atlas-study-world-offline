@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer from https://nodejs.org/ to use the optional companion.
  echo You can still open atlas-study-world.html directly for offline tracking.
  pause
  exit /b 1
)
node companion.mjs
pause
