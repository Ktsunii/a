# 🪟 Guia Completo de Setup para Windows

Sistema automatizado de monitoramento com Prometheus e Grafana para Windows 10/11.

## 📋 Índice

- [Pré-requisitos Windows](#-pré-requisitos-windows)
- [Instalação do Docker Desktop](#-instalação-do-docker-desktop)
- [Configuração Inicial](#-configuração-inicial)
- [Como Usar no Windows](#-como-usar-no-windows)
- [Troubleshooting Windows](#-troubleshooting-windows)
- [Comandos PowerShell](#-comandos-powershell)
- [WSL2 vs Hyper-V](#-wsl2-vs-hyper-v)

## 🔧 Pré-requisitos Windows

### Requisitos Mínimos

- **Windows 10** (versão 2004 ou superior) ou **Windows 11**
- **RAM:** 8GB ou mais (recomendado 16GB)
- **Disco:** 20GB de espaço livre
- **CPU:** Suporte para virtualização (Intel VT-x ou AMD-V)

### Verificar Versão do Windows

Abra PowerShell e execute:

```powershell
# Verificar versão do Windows
[System.Environment]::OSVersion.Version

# Verificar build
Get-ComputerInfo | Select-Object WindowsVersion, WindowsBuildLabEx
```

## 🐳 Instalação do Docker Desktop

### Método 1: Download Direto

1. **Baixe o Docker Desktop:**
   - Acesse: https://www.docker.com/products/docker-desktop
   - Clique em "Download for Windows"

2. **Execute o instalador:**
   - Duplo clique em `Docker Desktop Installer.exe`
   - Marque a opção **"Use WSL 2 instead of Hyper-V"** (recomendado)
   - Clique em "Ok" e aguarde a instalação

3. **Reinicie o computador** quando solicitado

4. **Inicie o Docker Desktop:**
   - Procure "Docker Desktop" no menu iniciar
   - Aguarde o Docker iniciar (ícone da baleia na bandeja do sistema)

### Método 2: Via Winget (Windows 11)

```powershell
# Abrir PowerShell como Administrador
winget install Docker.DockerDesktop
```

### Verificar Instalação

Abra PowerShell e execute:

```powershell
# Verificar versão do Docker
docker --version

# Verificar Docker Compose
docker compose version

# Testar Docker
docker run hello-world
```

**Saída esperada:**
```
Docker version 24.0.x, build xxxxx
Docker Compose version v2.x.x
Hello from Docker!
```

## ⚙️ Configuração Inicial

### 1. Habilitar WSL2 (se necessário)

Se você escolheu usar WSL2, precisa habilitá-lo:

```powershell
# Abrir PowerShell como Administrador
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar o computador
Restart-Computer
```

Após reiniciar:

```powershell
# Definir WSL2 como padrão
wsl --set-default-version 2

# Instalar Ubuntu (opcional)
wsl --install -d Ubuntu
```

### 2. Configurar Docker Desktop

1. Abra Docker Desktop
2. Clique no ícone de **Configurações (engrenagem)**
3. Vá em **Resources → Advanced**
   - **CPUs:** 4 (mínimo 2)
   - **Memory:** 4GB (mínimo 2GB)
   - **Swap:** 1GB
4. Clique em **Apply & Restart**

### 3. Configurar Política de Execução do PowerShell

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Confirmar com 'Y' quando solicitado
```

## 🚀 Como Usar no Windows

### Método 1: Scripts PowerShell (Recomendado)

#### Iniciar Tudo

Abra PowerShell na pasta do projeto:

```powershell
# Navegar até a pasta
cd C:\Users\SeuUsuario\projeto\chat

# Executar script de inicialização
.\start-all.ps1
```

**Saída esperada:**
```
============================================
  Iniciando Aplicação e Monitoramento
============================================

[1/3] Iniciando Aplicação Principal...
[OK] Aplicação iniciada com sucesso!

[2/3] Configurando Monitoramento...
[INFO] IP detectado: 192.168.1.100
[SUCCESS] Arquivo criado: node-exporter.json
[SUCCESS] Configuração concluída!

[3/3] Iniciando Stack de Monitoramento...
[OK] Monitoramento iniciado com sucesso!

============================================
  Todos os serviços foram iniciados!
============================================

Acesse os serviços:
  Aplicação:  http://localhost:3000
  Prometheus: http://localhost:9090
  Grafana:    http://localhost:3001
```

#### Parar Tudo

```powershell
.\stop-all.ps1
```

### Método 2: Comandos Manuais

#### Passo 1: Iniciar Aplicação

```powershell
# Na pasta raiz do projeto
docker compose up -d

# Verificar containers
docker compose ps
```

#### Passo 2: Configurar Monitoramento

```powershell
# Entrar na pasta monitoring
cd monitoring

# Executar script de configuração
.\scripts\set_cluster_env.ps1

# Verificar arquivo criado
Get-Content .\prometheus\targets\node-exporter.json
```

#### Passo 3: Iniciar Monitoramento

```powershell
# Ainda na pasta monitoring
docker compose up -d

# Voltar para pasta raiz
cd ..
```

## 🌐 Acessar Serviços

Após iniciar, abra no navegador:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Aplicação** | http://localhost:3000 | Chat App |
| **Prometheus** | http://localhost:9090 | Métricas |
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |

### Abrir no Navegador via PowerShell

```powershell
# Abrir aplicação
Start-Process "http://localhost:3000"

# Abrir Grafana
Start-Process "http://localhost:3001"

# Abrir Prometheus
Start-Process "http://localhost:9090"
```

## 🔍 Troubleshooting Windows

### Problema: "Docker não está rodando"

**Solução:**

```powershell
# Verificar se Docker está ativo
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Se não estiver, iniciar manualmente
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Aguardar 30 segundos e testar
Start-Sleep -Seconds 30
docker ps
```

### Problema: "Erro ao executar script .ps1"

**Erro:** `não pode ser carregado porque a execução de scripts foi desabilitada`

**Solução:**

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou executar o script com bypass
PowerShell.exe -ExecutionPolicy Bypass -File .\start-all.ps1
```

### Problema: "Porta já em uso"

**Erro:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solução:**

```powershell
# Descobrir o que está usando a porta
netstat -ano | findstr :3000

# O último número é o PID, matar o processo
taskkill /PID <numero_do_pid> /F

# Exemplo:
taskkill /PID 12345 /F
```

### Problema: WSL2 não está instalado

**Erro:** `WSL 2 installation is incomplete`

**Solução:**

```powershell
# Instalar WSL2
wsl --install

# Ou atualizar kernel
wsl --update

# Verificar versão
wsl --version
```

### Problema: Hyper-V não está habilitado

**Solução:**

```powershell
# Abrir PowerShell como Administrador
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All

# Reiniciar
Restart-Computer
```

### Problema: IP não detectado

**Solução manual:**

```powershell
# Descobrir IP manualmente
ipconfig | Select-String "IPv4"

# Editar arquivo manualmente
$ip = "192.168.1.100"  # Seu IP
$json = @"
[
  {
    "labels": {"job": "node-exporter", "instance": "$ip"},
    "targets": ["$ip:9100"]
  }
]
"@
$json | Out-File "monitoring\prometheus\targets\node-exporter.json" -Encoding UTF8
```

### Problema: Containers não iniciam

**Verificar logs:**

```powershell
# Ver logs da aplicação
docker compose logs app

# Ver logs do Prometheus
cd monitoring
docker compose logs prometheus

# Ver todos os logs
docker compose logs --tail=50
```

**Reiniciar tudo:**

```powershell
# Parar tudo
.\stop-all.ps1

# Limpar containers antigos
docker container prune -f
docker volume prune -f

# Iniciar novamente
.\start-all.ps1
```

## 💻 Comandos PowerShell

### Gerenciamento de Containers

```powershell
# Ver containers rodando
docker ps

# Ver todos os containers (incluindo parados)
docker ps -a

# Parar todos os containers
docker stop $(docker ps -q)

# Remover todos os containers
docker rm $(docker ps -aq)

# Ver uso de recursos
docker stats

# Limpar sistema
docker system prune -a --volumes
```

### Logs e Debug

```powershell
# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f app

# Ver últimas 50 linhas
docker compose logs --tail=50

# Executar comando dentro do container
docker exec -it monitoring-prometheus sh
```

### Rede e Conectividade

```powershell
# Verificar redes Docker
docker network ls

# Inspecionar rede
docker network inspect chat_app-network

# Testar conectividade
Test-NetConnection -ComputerName localhost -Port 3000
Test-NetConnection -ComputerName localhost -Port 9090
Test-NetConnection -ComputerName localhost -Port 3001
```

### Arquivos e Configuração

```powershell
# Ver conteúdo do arquivo de targets
Get-Content monitoring\prometheus\targets\node-exporter.json

# Ver variáveis de ambiente
Get-Content monitoring\.env

# Editar arquivo rapidamente
notepad monitoring\prometheus\prometheus.yml
```

## 🔄 WSL2 vs Hyper-V

### WSL2 (Recomendado para Windows 11)

**Vantagens:**
- ✅ Mais rápido e leve
- ✅ Melhor integração com Windows
- ✅ Menor uso de memória
- ✅ Inicialização mais rápida

**Desvantagens:**
- ❌ Requer Windows 10 2004+ ou Windows 11

### Hyper-V (Para Windows 10 Pro/Enterprise)

**Vantagens:**
- ✅ Funciona em versões mais antigas
- ✅ Suporte nativo do Windows

**Desvantagens:**
- ❌ Mais pesado
- ❌ Uso maior de recursos
- ❌ Não disponível no Windows Home

### Trocar entre WSL2 e Hyper-V

No Docker Desktop:
1. Abra **Settings**
2. Vá em **General**
3. Marque/desmarque **"Use the WSL 2 based engine"**
4. Clique em **Apply & Restart**

## 🔒 Firewall e Segurança

### Adicionar Exceção no Firewall

```powershell
# Abrir PowerShell como Administrador

# Adicionar regra para porta 3000
New-NetFirewallRule -DisplayName "Chat App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Adicionar regra para Prometheus
New-NetFirewallRule -DisplayName "Prometheus" -Direction Inbound -LocalPort 9090 -Protocol TCP -Action Allow

# Adicionar regra para Grafana
New-NetFirewallRule -DisplayName "Grafana" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## 📊 Monitoramento de Performance

### Verificar Uso de Recursos

```powershell
# CPU e Memória do sistema
Get-Counter '\Processor(_Total)\% Processor Time'
Get-Counter '\Memory\Available MBytes'

# Uso de disco
Get-PSDrive C | Select-Object Used,Free

# Processos Docker
Get-Process "*docker*" | Select-Object Name, CPU, PM
```

## 🎯 Scripts Úteis

### Script para Backup de Dados

```powershell
# backup-data.ps1
$backupPath = "C:\Backups\chat-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backupPath -Force
Copy-Item -Path ".\data" -Destination $backupPath -Recurse
Write-Host "Backup criado em: $backupPath" -ForegroundColor Green
```

### Script para Ver Status Completo

```powershell
# status.ps1
Write-Host "`n=== Status dos Serviços ===" -ForegroundColor Cyan
docker compose ps
Write-Host "`n=== Status do Monitoramento ===" -ForegroundColor Cyan
cd monitoring
docker compose ps
cd ..
Write-Host "`n=== Uso de Recursos ===" -ForegroundColor Cyan
docker stats --no-stream
```

## 📚 Recursos Adicionais

### Links Úteis

- [Docker Desktop para Windows](https://docs.docker.com/desktop/windows/)
- [WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)

### Atalhos de Teclado no PowerShell

- `Ctrl + C` - Parar comando atual
- `Ctrl + L` - Limpar tela
- `Tab` - Autocompletar
- `↑ / ↓` - Navegar histórico de comandos
- `F7` - Ver histórico completo

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a seção de [Troubleshooting](#-troubleshooting-windows)
2. Consulte os logs: `docker compose logs`
3. Reinicie o Docker Desktop
4. Abra uma issue no repositório

---

**Desenvolvido para Windows 10/11** | PowerShell 5.1+ | Docker Desktop 4.0+
