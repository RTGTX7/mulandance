@echo off
echo ========================================
echo MuDance Alpha 1.1.0 - Start Frontend & Backend
echo ========================================
echo.

REM Check if venv exists, create if not
if not exist venv\Scripts\python.exe (
    echo [0/3] Creating Python virtual environment...
    python -m venv venv >nul 2>&1
    echo Python virtual environment created.
)

echo [1/3] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements_backend.txt >nul 2>&1
if errorlevel 1 (
    echo Warning: Some Python dependencies could not be installed.
) else (
    echo Python dependencies installed.
)
echo.

echo [2/3] Starting Backend (FastAPI) on http://localhost:8001...
start "Backend" cmd /c "cd /d %cd%\backend && call ..\venv\Scripts\activate.bat && set PYTHONPATH=%cd%\.. && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul
echo.

echo [3/3] Starting Frontend (Next.js) on http://localhost:3000...
start "Frontend" cmd /c "cd /d %cd%\frontend && npm run dev"
echo.

echo ========================================
echo Services starting...
echo Backend:  http://localhost:8001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8001/docs
echo ========================================
echo.
echo Press any key to close this window...
pause >nul