# 🎯 Guia Rápido - 3 Passos

## ⚡ Método Automatizado

### 🐧 Linux/macOS

```bash
# 1. Tornar scripts executáveis
chmod +x start-all.sh stop-all.sh

# 2. Iniciar tudo
./start-all.sh

# 3. Acessar
# Chat: http://localhost:3000
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

### 🪟 Windows (PowerShell)

```powershell
# 1. Abrir PowerShell na pasta do projeto

# 2. Iniciar tudo
.\start-all.ps1

# 3. Acessar
# Chat: http://localhost:3000
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

**📘 Guia Completo Windows:** [WINDOWS-SETUP.md](WINDOWS-SETUP.md)

---

## 📋 Método Manual

### 🐧 Para Linux/Ubuntu

### 1️⃣ Iniciar Aplicação
```bash
docker compose up -d
```

### 2️⃣ Configurar Monitoramento
```bash
cd monitoring
./scripts/set_cluster_env.sh
docker compose up -d
cd ..
```

### 3️⃣ Acessar
- Chat: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

### 🪟 Para Windows (PowerShell)

### 1️⃣ Iniciar Aplicação
```powershell
docker compose up -d
```

### 2️⃣ Configurar Monitoramento
```powershell
cd monitoring
.\scripts\set_cluster_env.ps1
docker compose up -d
cd ..
```

### 3️⃣ Acessar
- Chat: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

## 🛑 Parar Tudo

**🐧 Linux/macOS:**
```bash
./stop-all.sh
```

**🪟 Windows:**
```powershell
.\stop-all.ps1
```

---

## 📊 Visualizar Métricas no Grafana

1. Acesse http://localhost:3001
2. Login: `admin` / Senha: `admin`
3. Vá em **Dashboards** → **Monitoramento do Sistema**
4. Selecione sua máquina no dropdown superior

---

## 🔧 Comandos Úteis

```bash
# Ver status dos containers
docker ps

# Ver logs em tempo real
docker compose logs -f

# Reiniciar um serviço
docker compose restart app

# Limpar tudo
docker compose down -v
cd monitoring && docker compose down -v && cd ..
```

---

## ❗ Problemas Comuns

**"Port already in use"**
```bash
sudo lsof -i :3000  # Ver o que está usando
sudo kill -9 <PID>  # Matar o processo
```

**"Cannot connect to Docker daemon"**
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

**Prometheus não mostra métricas**
```bash
cd monitoring
./scripts/set_cluster_env.sh
docker compose restart prometheus
cd ..
```
