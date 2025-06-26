@echo off
echo ===================================================
echo    Remote Health Monitoring System - Presentation
echo ===================================================
echo.

REM Start the backend server
echo Starting backend server...
start cmd /k "cd RemoteHealthBackend-main && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Short delay to ensure backend starts first
timeout /t 3 /nobreak > nul

REM Start the frontend
echo Starting frontend...
start cmd /k "cd remote-health-frontend && npm start"

echo.
echo Both servers are starting...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/api/v1
echo.

pause
