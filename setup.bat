@echo off
REM setup.bat - Automated setup script for Territory Running App (Windows)

echo ================================
echo Territory Running App - Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js v14+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm found: %NPM_VERSION%

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠ PostgreSQL is not installed
    echo Please install PostgreSQL from https://www.postgresql.org/download/
    echo.
    echo After installing PostgreSQL, run in psql:
    echo   CREATE DATABASE territory_running_app;
    echo   \i config/database.sql
    echo.
) else (
    echo ✓ PostgreSQL found
)

REM Install npm dependencies
echo.
echo Installing npm dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo.
    echo ⚠ .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo ⚠ Please edit .env and configure database credentials
    echo   Open .env in a text editor and update:
    echo   - DB_HOST=localhost
    echo   - DB_USER=postgres
    echo   - DB_PASSWORD=your_password
    echo.
    notepad .env
)

echo.
echo ✓ Setup complete!
echo.
echo Next steps:
echo 1. Configure database:
echo    - Edit .env with your PostgreSQL credentials
echo    - In PostgreSQL:
echo      CREATE DATABASE territory_running_app;
echo      \i config/database.sql
echo.
echo 2. Start the server:
echo    npm run dev
echo.
echo 3. Open in browser:
echo    http://localhost:3000
echo.
pause
