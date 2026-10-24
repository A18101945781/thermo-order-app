@echo off
chcp 65001 >nul
rem 开机自启入口：登录时由「启动」文件夹调用，启动采购单自动落盘服务
call "D:\ai\thermo-order-app\tools\start-export-server.bat"
