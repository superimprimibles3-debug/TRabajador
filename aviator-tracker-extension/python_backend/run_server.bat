@echo off
title Aviator Global Clicker Server
echo ==========================================
echo      INSTALANDO DEPENDENCIAS...
echo ==========================================
cd /d "%~dp0"
pip install -r requirements.txt

cls
echo ==========================================
echo      INICIANDO SERVIDOR DE CLICKS
echo ==========================================
python server.py
pause
