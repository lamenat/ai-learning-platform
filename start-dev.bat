@echo off
title AI Learning Platform — Dev Server
cd /d C:\Project\ai-learning-platform
echo === Запуск dev-сервера ===
echo Папка: %CD%
echo.
call npm run dev
echo.
echo === Сервер остановлен ===
pause