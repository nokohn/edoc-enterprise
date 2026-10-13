@echo off
cd /d "%~dp0.."
node server/dist/server.js > "%~dp0server.log" 2>&1
