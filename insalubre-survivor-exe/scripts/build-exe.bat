@echo off
REM Navigate to the src directory
cd /d "%~dp0..\src"

REM Run PyInstaller to create the executable
pyinstaller --onefile --console main.py

REM Move the generated executable to the parent directory
move dist\main.exe ..\insalubre-survivor.exe

REM Clean up the build files
rmdir /s /q build
rmdir /s /q dist
del main.spec

echo.
echo Executable criado com sucesso: insalubre-survivor.exe
echo.
pause