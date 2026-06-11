@echo off
setlocal
chcp 65001 >nul 2>nul
title AgencySuperpowersProduct / VideoBrain 启动器

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend-node"
set "LOGDIR=%ROOT%logs"

if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo.
echo ================================================
echo   AgencySuperpowersProduct / VideoBrain 启动器
echo ================================================
echo.

echo [1/5] 清理旧端口 3000 / 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
timeout /t 2 /nobreak >nul

echo [2/5] 检查 Node.js / npm...
where node >nul 2>nul
if errorlevel 1 (
  echo 没找到 node，请先安装 Node.js。
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo 没找到 npm，请先安装 Node.js。
  pause
  exit /b 1
)

echo [3/5] 检查依赖...
if not exist "%FRONTEND%\node_modules" (
  echo 正在安装前端依赖，请稍等...
  pushd "%FRONTEND%"
  call npm install
  if errorlevel 1 (
    echo 前端依赖安装失败。
    popd
    pause
    exit /b 1
  )
  popd
)
if not exist "%BACKEND%\node_modules" (
  echo 正在安装后端依赖，请稍等...
  pushd "%BACKEND%"
  call npm install
  if errorlevel 1 (
    echo 后端依赖安装失败。
    popd
    pause
    exit /b 1
  )
  popd
)

echo [4/5] 启动后端 API: http://localhost:8000
start "AgencySuperpowers Backend" cmd /k call "%ROOT%run-backend.bat"
timeout /t 3 /nobreak >nul

echo [5/5] 启动前端网页: http://localhost:3000
start "AgencySuperpowers Frontend" cmd /k call "%ROOT%run-frontend.bat"

echo.
echo 等待服务启动...
timeout /t 10 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000' -TimeoutSec 8; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo.
  echo 网页暂时还没响应，请再等 10-20 秒后刷新。
  echo 前端日志：%LOGDIR%\frontend-start.log
  echo 后端日志：%LOGDIR%\backend-start.log
) else (
  echo 网页已响应。
)

start "" http://localhost:3000

echo.
echo ================================================
echo   已启动。不要关闭 Backend / Frontend 两个窗口。
echo   网页: http://localhost:3000
echo   API : http://localhost:8000
echo ================================================
echo.
echo 这个启动器窗口可以关闭；服务窗口不要关。
pause
