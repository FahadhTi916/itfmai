@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required. Install Python 3.10 or newer first.
  pause
  exit /b 1
)
python local_server.py
pause
