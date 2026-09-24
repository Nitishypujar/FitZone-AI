@echo off
cls
cd /d F:\FitZone-AI

echo ========================================
echo FitZone AI Health Check
echo ========================================

echo.
echo [Backend]
node -e "fetch('http://localhost:5000/api/health').then(async r=>console.log('Backend:',r.status,await r.text())).catch(e=>console.log('Backend: unavailable - '+e.message))"

echo.
echo [Personalization ML]
node -e "fetch('http://127.0.0.1:8000/health').then(async r=>console.log('Personalization ML:',r.status,await r.text())).catch(e=>console.log('Personalization ML: unavailable - '+e.message))"

echo.
echo [Source contracts]
node tools\verify-project.js

echo.
echo [Backend tests]
cd backend
call npm test
cd ..

echo.
echo [Frontend build]
cd frontend
call npm run build
cd ..

echo.
echo Health check complete.
pause
