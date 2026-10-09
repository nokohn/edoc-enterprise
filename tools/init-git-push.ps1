# ==============================================================================
# Helper Script: Git Init and Prepare for GitHub & Cloud Deployment
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 📦 ກຳລັງກຽມພ້ອມ Source Code ສຳລັບ Deploy ຂຶ້ນ Cloud..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Initialize Git if not exists
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized." -ForegroundColor Green
}

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: complete enterprise E-Doc system with 24/7 cloud deployment configs"

Write-Host ""
Write-Host "🎉 Source Code ພ້ອມແລ້ວ! ເພື່ອນຳຂຶ້ນ GitHub ໃຫ້ໃຊ້ຄຳສັ່ງ:" -ForegroundColor Yellow
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
