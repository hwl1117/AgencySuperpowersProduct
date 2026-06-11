@echo off
chcp 65001 >/dev/null
echo ========================================
echo   VideoBrain 开发服务器重启工具
echo ========================================
echo.

echo [1/4] 停止旧进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >/dev/null 2>&1
)
echo      完成

echo [2/4] 清理缓存...
rd /s /q ".next" 2>/dev/null
echo      完成

echo [3/4] 启动开发服务器...
echo.
echo   🌐 http://localhost:3000
echo   按 Ctrl+C 停止
echo ========================================
echo.

npx next dev -p 3000
