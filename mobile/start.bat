@echo off
echo ========================================
echo Aipron Mobile App - Quick Start
echo ========================================
echo.

echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo Starting Expo development server...
echo.
echo ========================================
echo Press 'w' for web preview
echo Press 'i' for iOS simulator (Mac only)
echo Press 'a' for Android emulator
echo Scan QR code with Expo Go app on phone
echo ========================================
echo.

call npx expo start

pause
