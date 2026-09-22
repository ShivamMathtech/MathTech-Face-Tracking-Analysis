@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
 py scripts\serve.py
) else (
 python scripts\serve.py
)
pause
