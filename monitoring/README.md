# 🚀 Auto-Discovery Node Monitoring

Sistema automatizado de descoberta e monitoramento de nodes para Prometheus e Grafana. Detecta e integra automaticamente múltiplas máquinas no stack de monitoramento.

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Como Usar](#-como-usar)
- [Adicionando Novos Hosts](#-adicionando-novos-hosts)
- [Verificação e Troubleshooting](#-verificação-e-troubleshooting)
- [Arquitetura](#-arquitetura)
- [Configuração Avançada](#-configuração-avançada)

## ✨ Funcionalidades

- ✅ Detecção automática de IP local (Windows e Linux)
- ✅ Descoberta dinâmica de nodes sem reiniciar containers
- ✅ Monitoramento centralizado com Prometheus e Grafana
- ✅ Dashboard pré-configurado de monitoramento do sistema
- ✅ Suporte multiplataforma
- ✅ Scripts de inicialização e parada simplificados

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20.10 ou superior)
  ```bash
  docker --version
  ```
- **Docker Compose** (versão 2.0 ou superior)
  ```bash
  docker compose version
  ```
- **Git** (para clonar o repositório)
  ```bash
  git --version
  ```

### Instalação do Docker (se necessário)

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

**Windows:**
- Baixe e instale o [Docker Desktop](https://www.docker.com/products/docker-desktop)

## 🔧 Instalação e Configuração

### Passo 1: Clone o Repositório

```bash
git clone <seu-repositorio>
cd chat
```

### Passo 2: Verifique a Estrutura do Projeto

```bash
tree -L 2
```

Você deve ver:
```
.
├── docker-compose.yml
├── monitoring/
│   ├── docker-compose.yml
│   ├── scripts/
│   └── prometheus/
├── src/
├── start-all.sh
└── stop-all.sh
```

## 🚀 Como Usar

### Método 1: Iniciar Tudo de Uma Vez (Recomendado)

Use o script automatizado que inicia a aplicação e o monitoramento:

```bash
./start-all.sh
```

Este script irá:
1. Iniciar a aplicação principal (Node.js + AntidoteDB)
2. Detectar automaticamente o IP da máquina
3. Configurar os targets do Prometheus
4. Iniciar o stack de monitoramento

**Saída esperada:**
```
=== Iniciando Aplicação Principal ===
✓ Aplicação iniciada

=== Configurando Monitoramento ===
[INFO] Detected IP address: 192.168.1.100
[SUCCESS] Created node-exporter.json with IP: 192.168.1.100
[SUCCESS] Environment variable MACHINE_IP exported and saved to .env file
[SUCCESS] Setup completed successfully!

=== Iniciando Stack de Monitoramento ===
✓ Monitoramento iniciado

=== Todos os serviços iniciados com sucesso! ===
Aplicação:  http://localhost:3000
Prometheus: http://localhost:9090
Grafana:    http://localhost:3001 (admin/admin)
```

### Método 2: Iniciar Manualmente (Passo a Passo)

Se preferir maior controle:

#### 1. Iniciar a Aplicação Principal

```bash
docker compose up -d
```

Verifique se os containers estão rodando:
```bash
docker compose ps
```

Você deve ver:
- `chat-antidote-app` (porta 3000)
- `antidote` (porta 8087)

#### 2. Configurar e Iniciar o Monitoramento

```bash
cd monitoring
chmod +x scripts/set_cluster_env.sh
./scripts/set_cluster_env.sh
```

O script irá:
- Detectar seu IP automaticamente
- Criar o arquivo `prometheus/targets/node-exporter.json`
- Exportar a variável `MACHINE_IP`

#### 3. Iniciar o Stack de Monitoramento

```bash
docker compose up -d
cd ..
```

Verifique os containers:
```bash
cd monitoring && docker compose ps && cd ..
```

Você deve ver:
- `monitoring-prometheus` (porta 9090)
- `monitoring-grafana` (porta 3001)
- `monitoring-node-exporter` (porta 9100)

### Parar Todos os Serviços

```bash
./stop-all.sh
```

Ou manualmente:
```bash
cd monitoring && docker compose down && cd ..
docker compose down
```

## 🌐 Acessando os Serviços

Após a inicialização bem-sucedida, acesse:

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Aplicação Chat** | http://localhost:3000 | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | `admin` / `admin` |
| **Node Exporter** | http://localhost:9100/metrics | - |

### Primeiro Acesso ao Grafana

1. Acesse http://localhost:3001
2. Faça login com:
   - **Usuário:** `admin`
   - **Senha:** `admin`
3. (Opcional) Altere a senha quando solicitado
4. Navegue até **Dashboards** → **Monitoramento do Sistema**
5. Selecione sua máquina no dropdown **"Máquina"**

### Verificando Métricas no Prometheus

1. Acesse http://localhost:9090
2. Clique em **Status** → **Targets**
3. Verifique se os targets estão **UP**:
   - `prometheus` (localhost:9090)
   - `node-app` (app:3000)
   - `node-exporter` (seu-ip:9100)

## 🔍 Verificação e Troubleshooting

### Verificar Status dos Containers

```bash
# Aplicação principal
docker compose ps

# Stack de monitoramento
cd monitoring && docker compose ps && cd ..
```

### Verificar Logs

```bash
# Logs da aplicação
docker compose logs -f app

# Logs do Prometheus
cd monitoring && docker compose logs -f prometheus && cd ..

# Logs do Grafana
cd monitoring && docker compose logs -f grafana && cd ..
```

### Problemas Comuns

#### Erro: "Port already in use"

Se alguma porta estiver em uso:

```bash
# Verificar o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :9090
sudo lsof -i :3001

# Matar o processo ou mudar a porta no docker-compose.yml
```

#### Prometheus não encontra targets

```bash
# Verificar se o arquivo foi criado
cat monitoring/prometheus/targets/node-exporter.json

# Recriar o arquivo
cd monitoring
./scripts/set_cluster_env.sh
docker compose restart prometheus
cd ..
```

#### Grafana não carrega dashboards

```bash
# Verificar se os arquivos de provisioning existem
ls -la monitoring/grafana/provisioning/dashboards/
ls -la monitoring/grafana/provisioning/datasources/

# Reiniciar o Grafana
cd monitoring && docker compose restart grafana && cd ..
```

#### Node Exporter não está coletando métricas

```bash
# Verificar se o Node Exporter está acessível
curl http://localhost:9100/metrics

# Verificar logs
cd monitoring && docker compose logs node-exporter && cd ..
```

## 🏗️ Arquitetura

### Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                     Stack de Aplicação                       │
│  ┌──────────────┐           ┌──────────────┐               │
│  │   Node.js    │           │  AntidoteDB  │               │
│  │   (app)      │◄─────────►│   (antidote) │               │
│  │  porta 3000  │           │  porta 8087  │               │
│  └──────────────┘           └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Stack de Monitoramento                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prometheus (porta 9090)                  │  │
│  │  - Coleta métricas da aplicação                      │  │
│  │  - Descobre nodes automaticamente                    │  │
│  │  - Armazena séries temporais                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                 ▲                       ▲                    │
│                 │                       │                    │
│    ┌────────────┴──────────┐   ┌───────┴────────────┐      │
│    │   Node Exporter       │   │   Aplicação        │      │
│    │   (porta 9100)        │   │   Node.js          │      │
│    │   - CPU, RAM, Disco   │   │   (métricas app)   │      │
│    │   - Rede, I/O         │   │                    │      │
│    └───────────────────────┘   └────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Grafana (porta 3001)                     │  │
│  │  - Dashboards pré-configurados                       │  │
│  │  - Visualização de métricas                          │  │
│  │  - Alertas e notificações                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Processo de Auto-Descoberta

1. **Script `set_cluster_env.sh`:**
   - Detecta o sistema operacional (Linux/Windows)
   - Obtém o IP local da máquina
   - Cria `prometheus/targets/node-exporter.json` com:
     ```json
     [{
       "labels": {
         "job": "node-exporter",
         "instance": "192.168.1.100"
       },
       "targets": ["192.168.1.100:9100"]
     }]
     ```
   - Exporta `MACHINE_IP` como variável de ambiente

2. **Prometheus:**
   - Usa `file_sd_configs` para descoberta baseada em arquivo
   - Monitora o diretório `/etc/prometheus/targets/`
   - Atualiza a lista de targets a cada 30 segundos
   - Não precisa reiniciar para detectar novos nodes

3. **Node Exporter:**
   - Roda com `--net=host` e `--pid=host`
   - Coleta métricas do sistema hospedeiro
   - Expõe métricas na porta 9100

4. **Grafana:**
   - Configura automaticamente o datasource Prometheus
   - Carrega dashboards do diretório de provisioning
   - Usa variáveis `$instance` para filtrar por máquina

## 🌍 Adicionando Novos Hosts

### Cenário 1: Adicionar Node na Mesma Máquina

Se você deseja monitorar múltiplos serviços na mesma máquina, o sistema já está configurado automaticamente.

### Cenário 2: Adicionar Node em Máquina Remota

Para adicionar uma nova máquina ao cluster de monitoramento:

#### Na Máquina Remota:

1. **Copie apenas o Node Exporter:**
   ```bash
   mkdir -p ~/monitoring-node
   cd ~/monitoring-node
   ```

2. **Crie um docker-compose.yml simples:**
   ```yaml
   version: '3.8'
   services:
     node-exporter:
       image: prom/node-exporter:v1.6.1
       container_name: node-exporter
       network_mode: host
       pid: host
       restart: unless-stopped
       volumes:
         - /proc:/host/proc:ro
         - /sys:/host/sys:ro
         - /:/rootfs:ro
       command:
         - '--path.procfs=/host/proc'
         - '--path.sysfs=/host/sys'
         - '--path.rootfs=/rootfs'
   ```

3. **Inicie o Node Exporter:**
   ```bash
   docker compose up -d
   ```

4. **Obtenha o IP da máquina:**
   ```bash
   # Linux
   hostname -I | awk '{print $1}'
   
   # Windows (PowerShell)
   (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress
   ```

#### Na Máquina Central (Prometheus):

1. **Adicione manualmente o target:**
   ```bash
   cd monitoring/prometheus/targets
   ```

2. **Crie ou edite um arquivo JSON (ex: `remote-node-1.json`):**
   ```json
   [
     {
       "labels": {
         "job": "node-exporter",
         "instance": "192.168.1.200"
       },
       "targets": ["192.168.1.200:9100"]
     }
   ]
   ```

3. **O Prometheus detectará automaticamente em 30 segundos!**

4. **Verifique no Prometheus:**
   - Acesse http://localhost:9090/targets
   - O novo node deve aparecer como UP

5. **Verifique no Grafana:**
   - Acesse http://localhost:3001
   - Vá para o dashboard "Monitoramento do Sistema"
   - Selecione o novo IP no dropdown "Máquina"

### Cenário 3: Cluster com Múltiplos Nodes (Avançado)

Para um cluster com muitas máquinas, use armazenamento compartilhado.

## ⚙️ Configuração Avançada

### Armazenamento Compartilhado (NFS/GlusterFS)

Para múltiplas máquinas escrevendo targets em uma localização central:

1. **Configure um volume NFS:**
   ```bash
   # Na máquina central (servidor NFS)
   sudo apt install nfs-kernel-server
   sudo mkdir -p /mnt/shared/targets
   sudo chown nobody:nogroup /mnt/shared/targets
   echo "/mnt/shared/targets *(rw,sync,no_subtree_check)" | sudo tee -a /etc/exports
   sudo exportfs -a
   sudo systemctl restart nfs-kernel-server
   ```

2. **Nas máquinas clientes:**
   ```bash
   sudo apt install nfs-common
   sudo mkdir -p /mnt/shared/targets
   sudo mount <IP_SERVIDOR>:/mnt/shared/targets /mnt/shared/targets
   ```

3. **Modifique o script `set_cluster_env.sh`:**
   ```bash
   TARGETS_DIR="/mnt/shared/targets"
   ```

4. **Modifique o `docker-compose.yml` do Prometheus:**
   ```yaml
   volumes:
     - /mnt/shared/targets:/etc/prometheus/targets
   ```

### Configurar Alertas

Edite `monitoring/prometheus/prometheus.yml` para adicionar alertas:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - "alerts/*.yml"
```

### Ajustar Intervalo de Coleta

Edite `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 10s  # Padrão: 15s
  evaluation_interval: 10s
```

### Adicionar Métricas Customizadas

No seu código Node.js, use a biblioteca `prom-client`:

```javascript
const client = require('prom-client');
const register = new client.Registry();

// Criar métrica customizada
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);

// Expor métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 📚 Comandos Úteis

```bash
# Ver todos os containers rodando
docker ps

# Ver uso de recursos dos containers
docker stats

# Limpar containers parados
docker container prune

# Limpar volumes não utilizados
docker volume prune

# Reiniciar um serviço específico
cd monitoring && docker compose restart prometheus && cd ..

# Ver logs em tempo real
docker compose logs -f

# Executar comandos dentro de um container
docker exec -it monitoring-prometheus sh
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📞 Suporte

Se encontrar problemas:
1. Verifique a seção de [Troubleshooting](#-verificação-e-troubleshooting)
2. Consulte os logs dos containers
3. Abra uma issue no repositório