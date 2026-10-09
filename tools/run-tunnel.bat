@echo off
title E-Document Cloudflare 24/7 Live Tunnel
cls
echo ==========================================================
echo  🚀 Starting Cloudflare Live Tunnel for E-Doc Management
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0cloudflare-tunnel.ps1"
pause
