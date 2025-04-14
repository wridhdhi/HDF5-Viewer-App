@echo off
title HDF5 Heatmap Viewer - Quick Start

REM Set paths
set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend

echo Starting backend server...
start "HDF5 Heatmap Backend" cmd /c "cd %BACKEND_DIR% && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo Starting frontend server...
start "HDF5 Heatmap Frontend" cmd /c "cd %FRONTEND_DIR% && npm run dev"

echo Waiting for servers to start...
timeout /t 5 /nobreak > nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo HDF5 Heatmap Viewer is now running!
echo To stop the application, close this window and the server windows.