@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo MuDance Alpha 1.1.0 - Install and Start
echo Frontend ^& Backend
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo Error: npm was not found. Install Node.js 18+ and try again.
    pause
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo Error: python was not found. Install Python 3.11+ and try again.
    pause
    exit /b 1
)

if not exist "venv\Scripts\python.exe" (
    echo [1/5] Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 exit /b 1
) else (
    echo [1/5] Python virtual environment already exists.
)

echo [2/5] Installing backend dependencies...
call "venv\Scripts\activate.bat"
python -m pip install -r requirements_backend.txt
if errorlevel 1 exit /b 1

echo [3/5] Installing root npm dependencies...
call npm install
if errorlevel 1 exit /b 1

echo [4/5] Installing frontend npm dependencies...
pushd frontend
call npm install
if errorlevel 1 exit /b 1
popd

echo [5/5] Starting services...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo Database: backend\dance_org.db
echo.

start "MuDance Backend" cmd /k "cd /d ""%~dp0backend"" && call ..\venv\Scripts\activate.bat && set PYTHONPATH=%~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "MuDance Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Services are starting in separate windows.
echo Press any key to close this launcher window...
pause >nul
