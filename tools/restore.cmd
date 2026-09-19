@echo off
setlocal EnableExtensions
title FitZone AI - Restore
echo.
echo FITZONE AI RESTORE
echo.
echo WARNING: This script can overwrite the working project.
echo Use it only after selecting a verified backup.
echo.
set /p "BACKUP=Enter full backup folder path: "
if not exist "%BACKUP%\git\FitZone-AI.git\HEAD" (
  echo ERROR: Invalid backup folder.
  exit /b 1
)

echo.
echo Backup found:
echo %BACKUP%
echo.
choice /C YN /M "Continue with restore"
if errorlevel 2 exit /b 0

if not exist F:\FitZone-AI mkdir F:\FitZone-AI

echo.
echo [1/3] Restoring Git repository...
if exist F:\FitZone-AI\.git rmdir /s /q F:\FitZone-AI\.git
git clone "%BACKUP%\git\FitZone-AI.git" F:\FitZone-AI
if errorlevel 1 (
  echo ERROR: Git restore failed.
  exit /b 1
)

echo.
echo [2/3] Restoring working files...
robocopy "%BACKUP%\project" "F:\FitZone-AI" /E /R:1 /W:1
if %ERRORLEVEL% GEQ 8 (
  echo ERROR: Project restore failed.
  exit /b 1
)

echo.
echo [3/3] Checking repository...
cd /d F:\FitZone-AI
git status
git log -1 --oneline

echo.
echo RESTORE COMPLETE.
echo.
echo IMPORTANT:
echo - Recreate .env files from your secure copies.
echo - Reinstall dependencies only after verifying the restored source.
echo - Restore database separately.
echo.
exit /b 0
