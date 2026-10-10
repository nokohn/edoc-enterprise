@echo off
chcp 65001 > nul
title E-Document Management (Online 24/7)
set /p LIVE_URL=<"%~dp0LIVE-URL.txt"
if "%LIVE_URL%"=="" set LIVE_URL=https://ticket-inline-institutional-msgstr.trycloudflare.com
start "" "%LIVE_URL%"
exit
