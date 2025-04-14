@echo off
title HDF5 Heatmap Viewer - Setup Dependencies

echo ===================================================
echo      Setting up HDF5 Heatmap Viewer Environment
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
echo ===================================================
echo Setup complete! You can now run the application 
echo using quick_start.bat or start_heatmap_viewer.bat
echo ===================================================
pause
goto :eof

:error
echo.
echo Setup failed. See errors above.
pause
exit /b 1