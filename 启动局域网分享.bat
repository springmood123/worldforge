@echo off
chcp 65001 >nul
echo ====================================
echo   WorldForge 局域网分享启动器
echo ====================================
echo.
echo 正在启动服务器...
echo.
echo 提示：这个窗口不要关闭！
echo.
echo 访问地址：http://localhost:3000
echo.

:: 获取你的IP地址：
ipconfig | findstr /i "IPv4"
echo.
echo ====================================
echo.

npm run dev -- -H 0.0.0.0 -p 3000
