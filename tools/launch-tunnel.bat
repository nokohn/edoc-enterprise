@echo off
cd /d "%~dp0.."
node tools/tunnel-runner.js > "%~dp0tunnel.log" 2>&1
