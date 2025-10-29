# Script PowerShell para iniciar aplicação e monitoramento no Windows

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Iniciando Aplicação e Monitoramento" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está rodando
try {
    docker ps | Out-Null
}
catch {
    Write-Host "[ERRO] Docker não está rodando!" -ForegroundColor Red
    Write-Host "Inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Passo 1: Iniciar aplicação principal
Write-Host "[1/3] Iniciando Aplicação Principal..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao iniciar aplicação!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Aplicação iniciada com sucesso!" -ForegroundColor Green
Write-Host ""

# Passo 2: Configurar monitoramento
Write-Host "[2/3] Configurando Monitoramento..." -ForegroundColor Yellow
Set-Location monitoring
.\scripts\set_cluster_env.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha na configuração!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host ""

# Passo 3: Iniciar stack de monitoramento
Write-Host "[3/3] Iniciando Stack de Monitoramento..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao iniciar monitoramento!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "[OK] Monitoramento iniciado com sucesso!" -ForegroundColor Green
Write-Host ""

# Resumo
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Todos os serviços foram iniciados!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse os serviços:" -ForegroundColor Cyan
Write-Host "  Aplicação:  http://localhost:3000" -ForegroundColor White
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana:    http://localhost:3001" -ForegroundColor White
Write-Host "              (usuário: admin / senha: admin)" -ForegroundColor Gray
Write-Host ""
