@echo off
chcp 65001 > nul
title Setup Deploy Accounts (nokohn@gmail.com)
color 0B
cd /d "%~dp0\.."
cls

echo ==============================================================================
echo   🚀 ຕັ້ງຄ່າບັນຊີ Deploy ທັງໝົດໃຫ້ໃຊ້: nokohn@gmail.com
echo ==============================================================================
echo.
echo   ຂັ້ນຕອນທີ 1: Login GitHub ດ້ວຍບັນຊີ nokohn (nokohn@gmail.com)
echo   ຂັ້ນຕອນທີ 2: Push Source Code ຂຶ້ນ GitHub: nokohn/edoc-enterprise
echo   ຂັ້ນຕອນທີ 3: Login Cloudflare ດ້ວຍ nokohn@gmail.com
echo   ຂັ້ນຕອນທີ 4: Deploy Frontend ຂຶ້ນ Cloudflare Pages
echo.
echo ==============================================================================
echo ກົດປຸ່ມໃດກໍໄດ້ເພື່ອເລີ່ມຕົ້ນ...
pause > nul

echo.
echo ------------------------------------------------------------------------------
echo [1/4] ກຳລັງເປີດ Browser ເພື່ອ Login GitHub (ກະລຸນາເລືອກບັນຊີ nokohn@gmail.com)...
echo ------------------------------------------------------------------------------
gh auth login --hostname github.com --git-protocol https --web
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Login GitHub ບໍ່ສຳເລັດ ກະລຸນາກວດສອບອີກຄັ້ງ.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ------------------------------------------------------------------------------
echo [2/4] ກຳລັງຕັ້ງຄ່າ Git Credentials ແລະ Push ໂຄດຂຶ້ນ nokohn/edoc-enterprise...
echo ------------------------------------------------------------------------------
gh auth setup-git
git config user.name "nokohn"
git config user.email "nokohn@gmail.com"
git remote set-url origin https://github.com/nokohn/edoc-enterprise.git
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ ຖ້າ Push ບໍ່ສຳເລັດເນື່ອງຈາກ Repository ຍັງບໍ່ທັນຖືກສ້າງ:
    echo    ກຳລັງສ້າງ Repository nokohn/edoc-enterprise ໃຫ້ອັດຕະໂນມັດ...
    gh repo create nokohn/edoc-enterprise --public --source=. --remote=origin --push
)

echo.
echo ------------------------------------------------------------------------------
echo [3/4] ກຳລັງເປີດ Browser ເພື່ອ Login Cloudflare (ກະລຸນາເລືອກ nokohn@gmail.com)...
echo ------------------------------------------------------------------------------
call npx wrangler login
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Login Cloudflare ບໍ່ສຳເລັດ
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ------------------------------------------------------------------------------
echo [4/4] ກຳລັງ Deploy Frontend ຂຶ້ນ Cloudflare Pages ຂອງບັນຊີ nokohn@gmail.com...
echo ------------------------------------------------------------------------------
call npx wrangler pages deploy client/dist --project-name edoc-lao-enterprise

echo.
echo ==============================================================================
echo   🎉 ສຳເລັດທຸກຂັ້ນຕອນແລ້ວ!
echo   1. GitHub: ໂຄດອັບເດດຢູ່ https://github.com/nokohn/edoc-enterprise
echo   2. Cloudflare: Deploy ພາຍໃຕ້ບັນຊີ nokohn@gmail.com ຮຽບຮ້ອຍ!
echo   3. Render: ໃຫ້ Login ທີ່ dashboard.render.com ດ້ວຍ nokohn@gmail.com
echo      ແລ້ວເລືອກ New Blueprint -> nokohn/edoc-enterprise
echo ==============================================================================
echo.
pause
