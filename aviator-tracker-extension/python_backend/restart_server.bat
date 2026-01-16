@echo off
title Aviator Server Restart
cd /d "%~dp0"
echo ==========================================
echo      REINICIANDO SERVIDOR PYTHON
echo ==========================================

REM Kill existing server process by window title
taskkill /FI "WINDOWTITLE eq Aviator Global Clicker Server*" /F 2>nul

REM Alternative: Kill by process name if running via python.exe
taskkill /IM python.exe /F 2>nul

echo.
echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando servidor nuevamente...
start "" "%~dp0run_server.bat"

echo.
echo ==========================================
echo   SERVIDOR REINICIADO CORRECTAMENTE
echo ==========================================
timeout /t 3
