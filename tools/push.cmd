@echo off
cd /d "%~dp0\.."
cls
echo ========================================================
echo   Pushing E-Doc to GitHub (noysmk142-stack/edoc-enterprise)
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! Code pushed to GitHub successfully!
    echo ========================================================
) else (
    echo ========================================================
    echo   FAILED! Please check login in browser window.
    echo ========================================================
)
pause
