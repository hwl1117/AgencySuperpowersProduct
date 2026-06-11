@echo off
:: VideoBrain Desktop App - Hidden Launcher
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0VideoBrain-Desktop.ps1"
