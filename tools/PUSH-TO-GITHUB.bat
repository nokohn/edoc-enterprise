@echo off
chcp 65001 > nul
title Push E-Doc to GitHub
color 0B
cd /d "%~dp0\.."
cls
echo ============================================================
echo   🚀 กำลัง Push Code ຂຶ້ນ GitHub (nokohn/edoc-enterprise)...
echo ============================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ============================================================
    echo   🎉 ສຳເລັດແລ້ວ! ໂຄດທັງໝົດໄດ້ຖືກອັບໂຫຼດຂຶ້ນ GitHub ຮຽບຮ້ອຍ!
    echo ============================================================
) else (
    color 0C
    echo ============================================================
    echo   ❌ ເກີດຂໍ້ຜິດພາດ ກະລຸນາກວດສອບການ Login GitHub ໃນ Browser
    echo ============================================================
)
echo.
pause
