@echo off
title HDF5 Heatmap Viewer Launcher

echo ===================================================
echo      Starting HDF5 Heatmap Viewer Application
echo ===================================================
echo.

REM Set paths
set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in the PATH.
    echo Please install Python 3.8 or higher and try again.
    goto :error
)

REM Check if Node.js is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in the PATH.
    echo Please install Node.js and try again.
    goto :error
)

echo Installing backend requirements...
cd %BACKEND_DIR%
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install backend requirements.
    goto :error
)

echo Installing frontend dependencies...
cd %FRONTEND_DIR%
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install frontend dependencies.
    goto :error
)

echo.
echo Starting backend server...
start "HDF5 Heatmap Backend" cmd /c "cd %BACKEND_DIR% && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Starting frontend server...
start "HDF5 Heatmap Frontend" cmd /c "cd %FRONTEND_DIR% && npm run dev"

echo.
echo Waiting for servers to start...
timeout /t 10 /nobreak > nul

echo Opening application in default browser...
start http://localhost:5173

echo.
echo ===================================================
echo HDF5 Heatmap Viewer is now running!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo To stop the application, close this window and the server windows.
echo ===================================================

goto :eof

:error
echo.
echo Failed to start the HDF5 Heatmap Viewer. See errors above.
pause
exit /b 1