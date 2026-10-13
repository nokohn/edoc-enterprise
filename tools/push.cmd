@echo off
cd /d "%~dp0\.."
cls
set "PATH=C:\Users\Quitar kEOOUDOME\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
echo ========================================================
echo   Pushing E-Doc to GitHub (noysmk142-stack/edoc-enterprise)
echo ========================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! ອັບໂຫຼດຂຶ້ນ GitHub ສຳເລັດແລ້ວ!
    echo   Render ຈະເລີ່ມ Deploy ອັດຕະໂນມັດ ພາຍໃນ 2-3 ນາທີ
    echo ========================================================
) else (
    echo ========================================================
    echo   FAILED! ກະລຸນາກວດສອບການເຂົ້າສູ່ລະບົບ GitHub
    echo ========================================================
)
pause
