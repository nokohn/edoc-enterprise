@echo off
cd /d "%~dp0\.."
cls
echo ========================================================
echo   E-Doc GitHub Authentication (nokohn@gmail.com) and Push
echo ========================================================
echo.
echo 1. ກະລຸນາກົດ Enter ເພື່ອເຂົ້າສູ່ລະບົບ GitHub ຜ່ານ Browser...
echo.
gh auth login --hostname github.com --git-protocol https --web
echo.
echo 2. Setting up Git credentials...
gh auth setup-git
echo.
echo 3. ກຳລັງ Push ໂຄດຂຶ້ນ GitHub...
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCCESS] Push ສຳເລັດຮຽບຮ້ອຍແລ້ວ!
    echo   Render ຈະເລີ່ມ Deploy ອັດຕະໂນມັດພາຍໃນ 2-3 ນາທີ
    echo ========================================================
) else (
    echo ========================================================
    echo   [FAILED] Push ບໍ່ສຳເລັດ ກະລຸນາກວດສອບສິດການເຂົ້າເຖິງ
    echo ========================================================
)
pause
