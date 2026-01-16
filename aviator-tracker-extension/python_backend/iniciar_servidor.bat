@echo off
color 0A
title AVIATOR TRACKER - SERVIDOR UNIFICADO
cd /d "%~dp0"

echo =======================================================
echo    ROCKET LAUNCHER - AVIATOR TRACKER
echo =======================================================
echo.

echo [INFO] Verificando entorno...
echo.

REM Instalar dependencias si faltan
echo [1/2] Verificando dependencias Python...
pip install -r requirements.txt > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema instalando las dependencias.
    echo          Intentando instalar verbose para ver el error...
    pip install -r requirements.txt
    pause
    exit /b
)
echo [OK] Dependencias listas.

REM Iniciar Servidor
echo [2/2] Lanzando servidor maestro...
echo.
echo -------------------------------------------------------
echo  Presiona CTRL+C para detener el servidor
echo -------------------------------------------------------
echo.

python server.py

if %errorlevel% neq 0 (
    echo.
    echo [CRASH] El servidor se detuvo con codigo de error %errorlevel%
    pause
)
