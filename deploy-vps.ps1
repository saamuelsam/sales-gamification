# ========================================
# Script de Deploy para VPS Hostinger
# ========================================

Write-Host "🚀 Iniciando deploy para VPS..." -ForegroundColor Cyan

# 1. Commit e Push das mudanças
Write-Host "`n📝 Fazendo commit das mudanças..." -ForegroundColor Yellow
git add .
git commit -m "Fix: Adicionar variáveis de ambiente para Docker"
git push origin main

Write-Host "`n✅ Código enviado para o repositório!" -ForegroundColor Green

# 2. Instruções para a VPS
Write-Host "`n" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   PRÓXIMOS PASSOS - EXECUTAR NA VPS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conecte na VPS via SSH e execute:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd /var/www/sales-gamification" -ForegroundColor White
Write-Host "git pull origin main" -ForegroundColor White
Write-Host ""
Write-Host "# Copiar arquivo .env (PRIMEIRA VEZ APENAS):" -ForegroundColor Yellow
Write-Host "cp .env.production .env" -ForegroundColor White
Write-Host ""
Write-Host "# Rebuild e reiniciar containers:" -ForegroundColor Yellow
Write-Host "docker-compose down" -ForegroundColor White
Write-Host "docker-compose build --no-cache backend" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "# Verificar logs:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f backend" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Após executar, teste em: https://sales.sesfortal.com.br/login" -ForegroundColor Green
Write-Host ""
