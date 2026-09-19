@echo off
setlocal
echo ==========================================
echo FITZONE AI HEALTH CHECK
echo ==========================================
echo.
echo [Git]
git status --short
git log -1 --oneline
git remote -v
echo.
echo [Root]
dir /b
echo.
echo [State]
if exist PROJECT_STATE.md (echo PROJECT_STATE.md OK) else (echo PROJECT_STATE.md MISSING)
if exist FITZONE_RECOVERY_PROMPT.txt (echo FITZONE_RECOVERY_PROMPT.txt OK) else (echo FITZONE_RECOVERY_PROMPT.txt MISSING)
if exist docs\PROJECT_CHECKPOINT.md (echo PROJECT_CHECKPOINT.md OK) else (echo PROJECT_CHECKPOINT.md MISSING)
if exist docs\DECISIONS.md (echo DECISIONS.md OK) else (echo DECISIONS.md MISSING)
if exist docs\LEARNING_LOOP.md (echo LEARNING_LOOP.md OK) else (echo LEARNING_LOOP.md MISSING)
echo.
echo [Security]
if exist .env (echo WARNING: root .env exists - DO NOT COMMIT) else (echo No root .env)
if exist .gitignore (echo .gitignore OK) else (echo .gitignore MISSING)
echo.
echo [Node]
node --version
echo.
echo [Project Scripts]
if exist tools\backup.cmd (echo backup.cmd OK) else (echo backup.cmd MISSING)
if exist tools\restore.cmd (echo restore.cmd OK) else (echo restore.cmd MISSING)
if exist tools\health-check.cmd (echo health-check.cmd OK) else (echo health-check.cmd MISSING)
echo.
echo ==========================================
echo HEALTH CHECK COMPLETE
echo ==========================================
endlocal
