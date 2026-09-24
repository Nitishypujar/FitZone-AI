@echo off
setlocal EnableExtensions EnableDelayedExpansion
title FitZone AI - Backup
cd /d F:\FitZone-AI

set "STAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "STAMP=%STAMP: =0%"
set "BACKUP_ROOT=E:\FitZone-Backups\FitZone-AI"
set "RUN=%BACKUP_ROOT%\%STAMP%"
set "SOURCE=F:\FitZone-AI"

echo.
echo ==========================================
echo        FITZONE AI BACKUP
echo ==========================================
echo Source : %SOURCE%
echo Target : %RUN%
echo.

if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"
mkdir "%RUN%" 2>nul
mkdir "%RUN%\project" 2>nul
mkdir "%RUN%\git" 2>nul
mkdir "%RUN%\state" 2>nul

echo [1/6] Capturing Git state...
git status --short > "%RUN%\state\git-status.txt"
git log -1 --oneline > "%RUN%\state\git-head.txt"
git remote -v > "%RUN%\state\git-remotes.txt"
git branch -vv > "%RUN%\state\git-branches.txt"

echo [2/6] Creating Git mirror backup...
if exist "%RUN%\git\FitZone-AI.git" rmdir /s /q "%RUN%\git\FitZone-AI.git"
git clone --mirror "%SOURCE%" "%RUN%\git\FitZone-AI.git"
if errorlevel 1 (
  echo ERROR: Git mirror backup failed.
  goto :FAIL
)

echo [3/6] Copying working project files...
robocopy "%SOURCE%" "%RUN%\project" /E /R:1 /W:1 ^
 /XD "%SOURCE%\venv" "%SOURCE%\node_modules" "%SOURCE%\frontend\node_modules" "%SOURCE%\backend\node_modules" "%SOURCE%\ai-service\node_modules" "%SOURCE%\frontend\dist" "%SOURCE%\backend\dist" "%SOURCE%\ai-service\__pycache__" "%SOURCE%\.git" ^
 /XF ".env" ".env.*" "*.log" "*.pyc" "*.xpt" "*.parquet" "*.zip"
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
  echo ERROR: Project file copy failed with robocopy code %RC%.
  goto :FAIL
)

echo [4/6] Saving recovery/state documents...
for %%F in (PROJECT_STATE.md FITZONE_RECOVERY_PROMPT.txt) do (
  if exist "%SOURCE%\%%F" copy /Y "%SOURCE%\%%F" "%RUN%\state\" >nul
)
if exist "%SOURCE%\docs\PROJECT_CHECKPOINT.md" copy /Y "%SOURCE%\docs\PROJECT_CHECKPOINT.md" "%RUN%\state\" >nul
if exist "%SOURCE%\docs\DECISIONS.md" copy /Y "%SOURCE%\docs\DECISIONS.md" "%RUN%\state\" >nul

echo [5/6] Creating backup manifest...
(
 echo FitZone AI backup
 echo Timestamp: %STAMP%
 echo Source: %SOURCE%
 echo Git HEAD:
 type "%RUN%\state\git-head.txt"
 echo.
 echo NOTE: .env files and dependency folders are intentionally excluded.
 echo NOTE: Database and Supabase Storage require separate backup procedures.
) > "%RUN%\BACKUP_MANIFEST.txt"

echo [6/6] Verifying backup...
if not exist "%RUN%\git\FitZone-AI.git\HEAD" goto :FAIL
if not exist "%RUN%\project" goto :FAIL
if not exist "%RUN%\BACKUP_MANIFEST.txt" goto :FAIL

echo.
echo ==========================================
echo BACKUP COMPLETE
echo %RUN%
echo ==========================================
echo.
echo IMPORTANT:
echo 1. Do NOT delete the previous backup until this one is verified.
echo 2. Database backup is a separate step.
echo 3. Never copy .env files into the backup folder.
echo.
exit /b 0

:FAIL
echo.
echo ==========================================
echo BACKUP FAILED - DO NOT CONTINUE
echo Target: %RUN%
echo ==========================================
exit /b 1
