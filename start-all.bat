@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo MuDance Alpha 1.1.0 - Start
echo Frontend ^& Backend
echo ========================================
echo.

echo [1/2] Checking development database...
python backend\ensure_dev_db.py
if errorlevel 1 (
    echo.
    echo Database setup failed. Run install_win.bat first.
    pause
    exit /b 1
)

echo [2/2] Starting services...
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"
if "%LAN_IP%"=="" set "LAN_IP=YOUR-LAN-IP"
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo LAN Frontend: http://%LAN_IP%:3000
echo LAN Backend:  http://%LAN_IP%:8000/docs
echo Database: backend\dance_org.db
echo.

start "MuDance Backend" cmd /k "cd /d ""%~dp0backend"" && call ..\venv\Scripts\activate.bat && set PYTHONPATH=%~dp0backend && set PUBLIC_BASE_URL=http://%LAN_IP%:8000 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "MuDance Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Services are starting in separate windows.
echo Press any key to close this launcher window...
pause >nul
