# 🎯 Guia Rápido - 3 Passos

## Para Ubuntu/Linux

### 1️⃣ Tornar Scripts Executáveis
```bash
chmod +x start-all.sh stop-all.sh monitoring/scripts/set_cluster_env.sh
```

### 2️⃣ Iniciar Tudo
```bash
./start-all.sh
```

### 3️⃣ Acessar
- Chat: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

## Para Windows (PowerShell)

### 1️⃣ Iniciar Aplicação
```powershell
docker compose up -d
```

### 2️⃣ Configurar Monitoramento
```powershell
cd monitoring
bash scripts/set_cluster_env.sh
docker compose up -d
cd ..
```

### 3️⃣ Acessar
- Chat: http://localhost:3000
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

---

## 🛑 Parar Tudo

**Linux:**
```bash
./stop-all.sh
```

**Windows:**
```powershell
cd monitoring; docker compose down; cd ..; docker compose down
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
