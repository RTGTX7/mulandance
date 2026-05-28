@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo MuDance Windows Installer
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo Error: git was not found. Install Git for Windows and try again.
    pause
    exit /b 1
)

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

echo [1/6] Pulling latest code and database from main...
git pull origin main
if errorlevel 1 exit /b 1

echo [2/6] Creating Python virtual environment if needed...
if not exist "venv\Scripts\python.exe" (
    python -m venv venv
    if errorlevel 1 exit /b 1
) else (
    echo Python virtual environment already exists.
)

echo [3/6] Installing backend dependencies...
call "venv\Scripts\activate.bat"
python -m pip install -r requirements_backend.txt
if errorlevel 1 exit /b 1

echo [4/6] Installing root npm dependencies...
call npm install
if errorlevel 1 exit /b 1

echo [5/6] Installing frontend npm dependencies...
pushd frontend
call npm install
if errorlevel 1 exit /b 1
popd

echo [6/6] Syncing development database...
python backend\ensure_dev_db.py
if errorlevel 1 exit /b 1

echo.
echo Install complete.
echo Backend database: backend\dance_org.db
echo Default admin: admin@mulandance.com / admin123
echo.
pause
