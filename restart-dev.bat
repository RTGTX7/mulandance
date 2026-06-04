@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"

echo [1/4] Stopping processes on ports 3000 and 8000...
for %%P in (3000 8000) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    echo Killing PID %%A on port %%P
    taskkill /F /PID %%A >nul 2>nul
  )
)

echo [2/4] Cleaning Next.js cache...
if exist "%FRONTEND%\.next" (
  rmdir /S /Q "%FRONTEND%\.next"
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LAN_IP=%%I"
if "%LAN_IP%"=="" set "LAN_IP=YOUR-LAN-IP"

echo [3/4] Starting backend on http://localhost:8000 ...
start "Mulan Backend 8000" cmd /K "cd /D ""%BACKEND%"" && set PUBLIC_BASE_URL=http://%LAN_IP%:8000 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [4/4] Starting frontend on http://localhost:3000 ...
start "Mulan Frontend 3000" cmd /K "cd /D ""%FRONTEND%"" && npm run dev"

echo.
echo Done. Open:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000/docs
echo   LAN Frontend: http://%LAN_IP%:3000
echo   LAN Backend:  http://%LAN_IP%:8000/docs
echo.
echo If the browser still shows old errors, hard refresh with Ctrl+F5.
pause
