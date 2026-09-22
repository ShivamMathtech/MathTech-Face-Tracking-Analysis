@echo off
cd /d "%~dp0frontend"
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22 LTS or newer, then run this file again.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci
 if errorlevel 1 exit /b 1
)
call npm run dev -- --open
pause
