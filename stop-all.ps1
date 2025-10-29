# Script PowerShell para parar aplicação e monitoramento no Windows

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Parando Aplicação e Monitoramento" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Parar stack de monitoramento
Write-Host "[1/2] Parando Stack de Monitoramento..." -ForegroundColor Yellow
Set-Location monitoring
docker compose down
Set-Location ..
Write-Host "[OK] Monitoramento parado!" -ForegroundColor Red
Write-Host ""

# Passo 2: Parar aplicação principal
Write-Host "[2/2] Parando Aplicação Principal..." -ForegroundColor Yellow
docker compose down
Write-Host "[OK] Aplicação parada!" -ForegroundColor Red
Write-Host ""

Write-Host "============================================" -ForegroundColor Red
Write-Host "  Todos os serviços foram parados!" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""
