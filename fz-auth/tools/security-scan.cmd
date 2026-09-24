@echo off
cls
cd /d %~dp0..

echo ========================================
echo FitZone AI Security Scan Launcher
echo ========================================

echo.
echo This wrapper runs local source checks and, when Docker is installed,
echo an OWASP ZAP passive baseline scan against the running frontend.

echo.

node tools/security-check.js
if errorlevel 1 goto :fail

cd backend
node tests/security-validation.js
if errorlevel 1 goto :fail
cd ..

where docker >nul 2>nul
if errorlevel 1 (
  echo.
  echo Docker is not installed. OWASP ZAP baseline scan was NOT run.
  echo Install Docker on a supported machine, start FitZone frontend, then rerun this file.
  goto :done
)

echo.
echo Running OWASP ZAP baseline scan against http://host.docker.internal:5173 ...
if not exist reports mkdir reports
docker run --rm -t -v "%CD%\reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:5173 -r zap-baseline.html -J zap-baseline.json
if errorlevel 1 (
  echo ZAP reported one or more findings. Review reports\zap-baseline.html and do not ignore warnings blindly.
  goto :fail
)

echo ZAP baseline scan completed without a scanner failure.

goto :done

:fail
echo.
echo SECURITY SCAN FAILED
echo Review the output above before deployment.
exit /b 1

:done
echo.
echo SECURITY CHECKS COMPLETED
echo.
exit /b 0
