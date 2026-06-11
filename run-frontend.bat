@echo off
setlocal
chcp 65001 >nul 2>nul
cd /d "%~dp0frontend"
echo Frontend working directory: %cd%
echo Frontend log: %~dp0logs\frontend-start.log
echo.
npm run dev -- -p 3000 1>>"%~dp0logs\frontend-start.log" 2>>&1
echo.
echo 前端服务已停止。按任意键关闭窗口。
pause >nul
