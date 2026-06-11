@echo off
setlocal
chcp 65001 >nul 2>nul
cd /d "%~dp0backend-node"
echo Backend working directory: %cd%
echo Backend log: %~dp0logs\backend-start.log
echo.
node server-v2.js 1>>"%~dp0logs\backend-start.log" 2>>&1
echo.
echo 后端服务已停止。按任意键关闭窗口。
pause >nul
