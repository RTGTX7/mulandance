@echo off
cd /d "%~dp0"

echo Starting Backend (FastAPI)...
start "Backend" cmd /k "cd backend && venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Docs:     http://localhost:8000/docs
echo ========================================