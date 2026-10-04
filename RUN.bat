@echo off
REM ERP Application - Quick Start Script
REM Run this from C:\Users\Krisc\Desktop\git projects\ERP

title ERP Application Setup
color 0A

echo.
echo ================================================
echo    ERP Application Setup & Startup
echo ================================================
echo.

REM Check if Docker is running
echo [1/5] Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start database services
echo [2/5] Starting PostgreSQL and Redis...
docker-compose up -d postgres redis
if errorlevel 1 (
    echo ERROR: Failed to start database services
    pause
    exit /b 1
)
echo OK - Database services started

REM Wait for database to be ready
echo [3/5] Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Run migration
echo [4/5] Running database migration...
psql "postgresql://postgres:postgres123@localhost:5432/erp" -f supabase-migrations\00000000000001_add_role_permissions_table.sql
if errorlevel 1 (
    echo WARNING: Migration may have issues, but continuing...
)

REM Install API dependencies and start
echo [5/5] Starting API...
cd apps\api
start cmd /k "npm install && npx ts-node -r tsconfig-paths/register src\database\seed-complete.ts && npm run dev"

REM Wait a moment
timeout /t 5 /nobreak >nul

REM Install Web dependencies and start
echo Starting Web Frontend...
cd ..\web
start cmd /k "npm install && npm run dev"

echo.
echo ================================================
echo    Application is starting...
echo.
echo    Frontend: http://localhost:3000
echo    API: http://localhost:3001
echo.
echo    Login: admin@erp.com / admin123
echo ================================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:3000
