@echo off
title AI Civilization Stopper
cd /d "%~dp0"

echo [INFO] Stopping AI Civilization servers...

:: Kill backend (uvicorn)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /f /pid %%a 2>nul && echo [OK] Stopped backend on port 8000
)

:: Kill frontend (vite)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /f /pid %%a 2>nul && echo [OK] Stopped frontend on port 5173
)

echo [INFO] All servers stopped.
pause
