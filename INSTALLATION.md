# 📦 Instalação Completa - Guia Multiplataforma

Guia de instalação para Linux, macOS e Windows.

## 📚 Documentação Disponível

Este projeto possui documentação completa para diferentes necessidades:

| Documento | Descrição | Para Quem |
|-----------|-----------|-----------|
| **[README.md](README.md)** | Overview geral do projeto | Todos |
| **[QUICKSTART.md](QUICKSTART.md)** | Início rápido (3 passos) | Usuários iniciantes |
| **[WINDOWS-SETUP.md](WINDOWS-SETUP.md)** | Setup completo Windows + PowerShell | Usuários Windows |
| **[monitoring/README.md](monitoring/README.md)** | Documentação detalhada do monitoramento | Desenvolvedores/DevOps |

## 🐧 Linux (Ubuntu/Debian)

### 1. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 2. Clonar e Configurar

```bash
# Clonar repositório
git clone <seu-repositorio>
cd chat

# Tornar scripts executáveis
chmod +x start-all.sh stop-all.sh monitoring/scripts/set_cluster_env.sh

# Iniciar tudo
./start-all.sh
```

### 3. Acessar

- Aplicação: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

## 🍎 macOS

### 1. Instalar Docker Desktop

```bash
# Via Homebrew
brew install --cask docker

# Ou baixar manualmente
# https://www.docker.com/products/docker-desktop
```

### 2. Configurar e Iniciar

```bash
# Abrir Docker Desktop (primeira vez)
open /Applications/Docker.app

# Aguardar Docker iniciar
sleep 30

# Clonar repositório
git clone <seu-repositorio>
cd chat

# Tornar scripts executáveis
chmod +x start-all.sh stop-all.sh

# Iniciar tudo
./start-all.sh
```

### 3. Acessar

- Aplicação: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

## 🪟 Windows

### 1. Instalar Docker Desktop

**Método 1: Download Manual**
1. Baixe: https://www.docker.com/products/docker-desktop
2. Execute o instalador
3. Marque "Use WSL 2" (recomendado)
4. Reinicie o computador

**Método 2: Via Winget (Windows 11)**
```powershell
winget install Docker.DockerDesktop
```

### 2. Habilitar WSL2

```powershell
# Abrir PowerShell como Administrador
wsl --install

# Reiniciar o computador
Restart-Computer
```

### 3. Configurar Execução de Scripts

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Clonar e Iniciar

```powershell
# Clonar repositório
git clone <seu-repositorio>
cd chat

# Iniciar tudo
.\start-all.ps1
```

### 5. Acessar

- Aplicação: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

**📘 Para guia completo:** [WINDOWS-SETUP.md](WINDOWS-SETUP.md)

---

## 🔍 Verificar Instalação

### Verificar Docker

**Linux/macOS:**
```bash
docker --version
docker compose version
docker ps
```

**Windows PowerShell:**
```powershell
docker --version
docker compose version
docker ps
```

### Verificar Serviços

**Linux/macOS:**
```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f
```

**Windows PowerShell:**
```powershell
# Ver status
docker compose ps

# Ver logs
docker compose logs -f
```

---

## 🎯 Estrutura de Arquivos

```
chat/
├── README.md                    # Documentação principal
├── QUICKSTART.md                # Guia rápido
├── WINDOWS-SETUP.md             # Guia completo Windows
├── INSTALLATION.md              # Este arquivo
│
├── start-all.sh                 # Script Linux/macOS
├── stop-all.sh                  # Script Linux/macOS
├── start-all.ps1                # Script Windows
├── stop-all.ps1                 # Script Windows
│
├── docker-compose.yml           # Aplicação principal
├── Dockerfile
│
├── monitoring/                  # Stack de monitoramento
│   ├── README.md               # Documentação detalhada
│   ├── docker-compose.yml
│   ├── scripts/
│   │   ├── set_cluster_env.sh  # Script Linux/macOS
│   │   └── set_cluster_env.ps1 # Script Windows
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── targets/
│   └── grafana/
│       └── provisioning/
│
├── src/                         # Código da aplicação
├── public/
└── data/                        # Dados persistidos
```

---

## 🆘 Problemas Comuns

### Linux: Permission Denied

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Tornar scripts executáveis
chmod +x *.sh monitoring/scripts/*.sh
```

### macOS: Docker não está rodando

```bash
# Abrir Docker Desktop
open /Applications/Docker.app

# Aguardar inicialização
sleep 30

# Verificar
docker ps
```

### Windows: Script não pode ser executado

```powershell
# Abrir PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou executar com bypass
PowerShell.exe -ExecutionPolicy Bypass -File .\start-all.ps1
```

### Todos: Porta em uso

**Linux/macOS:**
```bash
# Verificar porta
sudo lsof -i :3000
sudo lsof -i :9090
sudo lsof -i :3001

# Matar processo
sudo kill -9 <PID>
```

**Windows:**
```powershell
# Verificar porta
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <numero> /F
```

---

## 📞 Próximos Passos

Após a instalação:

1. **Acessar Grafana:** http://localhost:3001
   - Login: `admin` / `admin`
   - Ir para Dashboards → Monitoramento do Sistema

2. **Ver métricas no Prometheus:** http://localhost:9090
   - Ir em Status → Targets
   - Verificar se todos estão UP

3. **Testar aplicação:** http://localhost:3000

4. **Ler documentação completa:**
   - [monitoring/README.md](monitoring/README.md) - Tutorial completo
   - [WINDOWS-SETUP.md](WINDOWS-SETUP.md) - Para usuários Windows

---

## 🔗 Links Úteis

- **Docker Docs:** https://docs.docker.com/
- **Prometheus Docs:** https://prometheus.io/docs/
- **Grafana Docs:** https://grafana.com/docs/
- **WSL2 Docs:** https://docs.microsoft.com/en-us/windows/wsl/

---

**Suporte multiplataforma:** Linux, macOS, Windows 10/11
