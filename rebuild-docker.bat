@echo off
setlocal

cd /d "%~dp0"

echo.
echo [1/3] Building and starting backend + frontend...
docker compose up -d --build backend frontend
if errorlevel 1 goto :fail

echo.
echo [2/3] Current containers:
docker compose ps
if errorlevel 1 goto :fail

echo.
echo [3/3] Done.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
goto :eof

:fail
echo.
echo Docker rebuild failed.
exit /b 1
