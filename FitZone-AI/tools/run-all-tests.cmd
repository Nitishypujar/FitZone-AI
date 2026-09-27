@echo off
cls
cd /d F:\FitZone-AI

echo ========================================
echo FitZone AI Full Verification
echo ========================================

echo.
echo [1/5] Backend source + contracts
cd backend
call npm run verify
if errorlevel 1 goto :fail
call npm test
if errorlevel 1 goto :fail
cd ..

echo.
echo [2/5] AI service Python syntax
python -m py_compile ai-service\main.py
if errorlevel 1 goto :fail

echo.
echo [3/5] Frontend lint
cd frontend
call npm run lint
if errorlevel 1 goto :fail

echo.
echo [4/5] Frontend production build
call npm run build
if errorlevel 1 goto :fail
cd ..

echo.
echo [5/5] Security source checks
node tools\security-check.js
if errorlevel 1 goto :fail

echo.
echo ========================================
echo ALL LOCAL SOURCE TESTS PASSED
echo ========================================
pause
exit /b 0

:fail
cd /d F:\FitZone-AI
echo.
echo ========================================
echo VERIFICATION FAILED
echo ========================================
pause
exit /b 1
