# ==============================================================================
# E-Document Management - Cloudflare 24/7 Live Tunnel Script
# ລະບົບເຊື່ອມຕໍ່ Cloudflare Tunnel ແບບອອນລາຍ 24 ຊົ່ວໂມງ ພ້ອມ SSL/HTTPS ຟຣີ
# ==============================================================================

$toolPath = "$PSScriptRoot\cloudflared.exe"
$port = 5000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 ກຳລັງເລີ່ມຕົ້ນ Cloudflare Tunnel ສຳລັບ E-Document..." -ForegroundColor Green
Write-Host " 📡 ເປົ້າໝາຍ Local Server: http://localhost:$port" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $toolPath)) {
    Write-Host "❌ ບໍ່ພົບໄຟລ໌ $toolPath! ກະລຸນາກວດສອບ ຫຼື ລໍຖ້າການດາວໂຫຼດສຳເລັດ." -ForegroundColor Red
    exit 1
}

Write-Host "🌐 ກຳລັງເຊື່ອມຕໍ່ຫາ Cloudflare Global Edge Network (HTTP/2 Mode)..." -ForegroundColor Cyan
& $toolPath tunnel --protocol http2 --url "http://localhost:$port"

