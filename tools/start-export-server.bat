@echo off
chcp 65001 >nul
title 采购单落盘服务 - 桌面\小程序订货
rem ── 找 Node：优先受管版本，其次 current，最后系统 PATH ──────────
set "NODE_EXE=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-6\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=C:\Users\Administrator\.workbuddy\binaries\node\versions\current\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
echo 使用 Node: %NODE_EXE%
"%NODE_EXE%" "%~dp0export-server.js"
echo.
echo 服务已停止。按任意键关闭窗口。
pause >nul
