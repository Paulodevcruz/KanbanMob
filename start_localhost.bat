@echo off
setlocal
cd /d "%~dp0"

set PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.12-64\python.exe

if not exist "%PYTHON_EXE%" (
    echo Python 3.12 nao foi encontrado.
    echo Verifique se o Python foi instalado em: %LOCALAPPDATA%\Python\pythoncore-3.12-64
    pause
    exit /b 1
)

powershell -NoProfile -Command "$r = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue; if ($r.TcpTestSucceeded) { Write-Host 'Ja existe um servidor em http://localhost:8000'; exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo Iniciando o servidor do KanbanMob em http://localhost:8000
    start "" http://localhost:8000
    "%PYTHON_EXE%" -m http.server 8000 --directory "%~dp0"
) else (
    echo Abrindo o projeto em http://localhost:8000
    start "" http://localhost:8000
)
