@echo off
setlocal
chcp 65001 >nul 2>nul
title AgencySuperpowersProduct Desktop App
cd /d "%~dp0"
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"

echo ================================================
echo   AgencySuperpowersProduct Desktop App
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Please install Node.js first.
  pause
  exit /b 1
)

if not exist "node_modules\electron" (
  echo First launch: installing Electron, please wait...
  call npm install
  if errorlevel 1 (
    echo Electron install failed.
    pause
    exit /b 1
  )
)

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd frontend
  call npm install
  if errorlevel 1 (
    echo Frontend install failed.
    popd
    pause
    exit /b 1
  )
  popd
)

if not exist "backend-node\node_modules" (
  echo Installing backend dependencies...
  pushd backend-node
  call npm install
  if errorlevel 1 (
    echo Backend install failed.
    popd
    pause
    exit /b 1
  )
  popd
)

echo Launching desktop app...
call npm run app