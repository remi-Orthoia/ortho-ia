@echo off
REM Build du .exe Ortho.ia Agent (Windows uniquement).
REM Pre-requis : Python 3.10+ installe et dans le PATH.

setlocal enabledelayedexpansion

echo === Installation des dependances ===
pip install -r requirements.txt
if errorlevel 1 goto :error

echo === Installation de PyInstaller ===
pip install pyinstaller
if errorlevel 1 goto :error

echo === Build ortho-ia-agent.exe ===
pyinstaller --onefile --windowed --name ortho-ia-agent ortho-ia-agent.py
if errorlevel 1 goto :error

echo.
echo === Build termine ===
echo Le fichier est dans dist\ortho-ia-agent.exe
goto :eof

:error
echo.
echo ERREUR pendant le build — voir les messages ci-dessus.
exit /b 1
