# 🎁 Script Automatizado - Inicialização Completa do Sistema de Benefícios
# Executa todos os passos necessários em sequência

Write-Host "
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎁  SISTEMA DE BENEFÍCIOS - INICIALIZAÇÃO AUTOMÁTICA   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# ============================================
# 1️⃣ VERIFICAR DOCKER
# ============================================
Write-Host "`n[1/6] 🐳 Verificando Docker..." -ForegroundColor Yellow

try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker está rodando!" -ForegroundColor Green
    } else {
        throw "Docker não está rodando"
    }
} catch {
    Write-Host "❌ Docker Desktop não está iniciado!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o Docker Desktop manualmente e execute este script novamente." -ForegroundColor Yellow
    Write-Host "   Pressione qualquer tecla para sair..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# ============================================
# 2️⃣ INICIAR POSTGRESQL
# ============================================
Write-Host "`n[2/6] 🗄️  Iniciando PostgreSQL..." -ForegroundColor Yellow

cd $PSScriptRoot

$postgresRunning = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-String "postgres"

if ($postgresRunning) {
    Write-Host "✅ PostgreSQL já está rodando!" -ForegroundColor Green
} else {
    Write-Host "   Iniciando container PostgreSQL..." -ForegroundColor Gray
    docker-compose up -d postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL iniciado com sucesso!" -ForegroundColor Green
        Write-Host "   Aguardando 10 segundos para PostgreSQL inicializar..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } else {
        Write-Host "❌ Erro ao iniciar PostgreSQL!" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# 3️⃣ VERIFICAR CONEXÃO COM BANCO
# ============================================
Write-Host "`n[3/6] 🔌 Testando conexão com banco de dados..." -ForegroundColor Yellow

$maxAttempts = 5
$attempt = 1

while ($attempt -le $maxAttempts) {
    Write-Host "   Tentativa $attempt de $maxAttempts..." -ForegroundColor Gray
    
    $testConnection = docker exec sales-gamification-postgres-1 psql -U admin -d sales_gamification -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão com banco estabelecida!" -ForegroundColor Green
        break
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ Não foi possível conectar ao banco após $maxAttempts tentativas!" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 3
    $attempt++
}

# ============================================
# 4️⃣ EXECUTAR SEED DE BENEFÍCIOS
# ============================================
Write-Host "`n[4/6] 🌱 Populando benefícios no banco de dados..." -ForegroundColor Yellow

cd backend

# Verificar se já existem benefícios
$benefitsCount = docker exec sales-gamification-postgres-1 psql -U admin -d sales_gamification -t -c "SELECT COUNT(*) FROM benefits;" 2>&1 | ForEach-Object { $_.Trim() }

if ($benefitsCount -and [int]$benefitsCount -gt 0) {
    Write-Host "   ℹ️  Já existem $benefitsCount benefícios no banco." -ForegroundColor Cyan
    Write-Host "   Deseja recriar os benefícios? (S/N): " -ForegroundColor Yellow -NoNewline
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host "   Removendo benefícios antigos..." -ForegroundColor Gray
        docker exec sales-gamification-postgres-1 psql -U admin -d sales_gamification -c "DELETE FROM benefits;" | Out-Null
        
        Write-Host "   Executando seed..." -ForegroundColor Gray
        npx tsx scripts/seed_benefits.ts
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Benefícios recriados com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao executar seed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Mantendo benefícios existentes." -ForegroundColor Green
    }
} else {
    Write-Host "   Executando seed pela primeira vez..." -ForegroundColor Gray
    npx tsx scripts/seed_benefits.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Benefícios criados com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao executar seed!" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# 5️⃣ VERIFICAR SE BACKEND JÁ ESTÁ RODANDO
# ============================================
Write-Host "`n[5/6] 🚀 Verificando backend..." -ForegroundColor Yellow

$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
    }
} catch {
    $backendRunning = $false
}

if ($backendRunning) {
    Write-Host "✅ Backend já está rodando na porta 4000!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Backend não está rodando." -ForegroundColor Cyan
    Write-Host "   Deseja iniciar o backend agora? (S/N): " -ForegroundColor Yellow -NoNewline
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host "   Iniciando backend em segundo plano..." -ForegroundColor Gray
        Write-Host "   (Uma nova janela do PowerShell será aberta)" -ForegroundColor Gray
        
        $backendPath = Join-Path $PSScriptRoot "backend"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend rodando...' -ForegroundColor Green; npx tsx -r tsconfig-paths/register src/server.ts"
        
        Write-Host "   Aguardando backend iniciar (15 segundos)..." -ForegroundColor Gray
        Start-Sleep -Seconds 15
        
        Write-Host "✅ Backend iniciado!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend não foi iniciado. Inicie manualmente quando necessário." -ForegroundColor Yellow
    }
}

# ============================================
# 6️⃣ VERIFICAR FRONTEND
# ============================================
Write-Host "`n[6/6] 🌐 Verificando frontend..." -ForegroundColor Yellow

$frontendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $frontendRunning = $true
    }
} catch {
    $frontendRunning = $false
}

if ($frontendRunning) {
    Write-Host "✅ Frontend já está rodando na porta 5173!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Frontend não está rodando." -ForegroundColor Cyan
    Write-Host "   Deseja iniciar o frontend agora? (S/N): " -ForegroundColor Yellow -NoNewline
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host "   Iniciando frontend em segundo plano..." -ForegroundColor Gray
        Write-Host "   (Uma nova janela do PowerShell será aberta)" -ForegroundColor Gray
        
        $frontendPath = Join-Path $PSScriptRoot "frontend"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🌐 Frontend rodando...' -ForegroundColor Green; npm run dev"
        
        Write-Host "   Aguardando frontend iniciar (10 segundos)..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        
        Write-Host "✅ Frontend iniciado!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend não foi iniciado. Inicie manualmente quando necessário." -ForegroundColor Yellow
    }
}

# ============================================
# 🎉 FINALIZAÇÃO
# ============================================
Write-Host "
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              🎉  INICIALIZAÇÃO CONCLUÍDA!  🎉             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Green

Write-Host "📊 RESUMO:" -ForegroundColor Cyan
Write-Host "   ✅ Docker: Rodando" -ForegroundColor Green
Write-Host "   ✅ PostgreSQL: Rodando" -ForegroundColor Green
Write-Host "   ✅ Benefícios: Populados no banco" -ForegroundColor Green

if ($backendRunning -or $resposta -eq "S" -or $resposta -eq "s") {
    Write-Host "   ✅ Backend: Rodando (http://localhost:4000)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend: Não iniciado" -ForegroundColor Yellow
}

if ($frontendRunning -or $resposta -eq "S" -or $resposta -eq "s") {
    Write-Host "   ✅ Frontend: Rodando (http://localhost:5173)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend: Não iniciado" -ForegroundColor Yellow
}

Write-Host "`n🌐 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "   2. Faça login com: admin@sesfortal.com / admin123" -ForegroundColor White
Write-Host "   3. Clique em 'Benefícios' no menu lateral" -ForegroundColor White
Write-Host "   4. Explore os 30+ benefícios disponíveis!" -ForegroundColor White

Write-Host "`n📚 DOCUMENTAÇÃO:" -ForegroundColor Cyan
Write-Host "   - BENEFICIOS_QUICK_START.md - Guia visual rápido" -ForegroundColor White
Write-Host "   - BENEFICIOS_RESUMO.md - Overview completo" -ForegroundColor White
Write-Host "   - BENEFICIOS_GUIA.md - Guia técnico detalhado" -ForegroundColor White

Write-Host "`n✨ Divirta-se explorando o sistema! ✨`n" -ForegroundColor Magenta

# Perguntar se quer abrir o navegador
Write-Host "Deseja abrir o sistema no navegador agora? (S/N): " -ForegroundColor Yellow -NoNewline
$abrirNavegador = Read-Host

if ($abrirNavegador -eq "S" -or $abrirNavegador -eq "s") {
    Start-Process "http://localhost:5173"
    Write-Host "✅ Navegador aberto!" -ForegroundColor Green
}

Write-Host "`nPressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
