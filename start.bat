@echo off
title AI Civilization Launcher
cd /d "%~dp0"

echo ============================================
echo   AI Civilization - Starting Both Servers
echo ============================================
echo.

:: Check if Python dependencies are installed
python3 -c "import fastapi" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing Python dependencies...
    cd backend
    python3 -m pip install -r requirements.txt
    cd ..
    echo.
)

:: Check if Node dependencies are installed
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
    echo.
)

:: Kill any existing processes on our ports
echo [INFO] Cleaning up any existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a 2>nul
timeout /t 1 /nobreak >nul

echo [INFO] Starting Backend (FastAPI) on http://localhost:8000
echo [INFO] Starting Frontend (Vite) on http://localhost:5173
echo.
echo [INFO] Open your browser to http://localhost:5173
echo [INFO] Press Ctrl+C in each window to stop servers.
echo.

:: Start backend in a new window
start "AI Civ - Backend" cmd /c "cd /d "%~dp0backend" && python3 -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

:: Small delay to let backend start first
timeout /t 2 /nobreak >nul

:: Start frontend in a new window
start "AI Civ - Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Both servers are starting up!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   Health:   http://localhost:8000/health
echo ============================================
echo.
pause
