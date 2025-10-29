# 💬 Chat Application com Monitoramento

Aplicação de chat usando Node.js, AntidoteDB e sistema completo de monitoramento com Prometheus e Grafana.

## 🚀 Quick Start

### Iniciar Tudo com Um Comando

```bash
./start-all.sh
```

Este comando irá:
- ✅ Iniciar a aplicação de chat (Node.js + AntidoteDB)
- ✅ Detectar automaticamente o IP da máquina
- ✅ Configurar o monitoramento (Prometheus + Grafana + Node Exporter)
- ✅ Iniciar todos os serviços

### Parar Todos os Serviços

```bash
./stop-all.sh
```

## 🌐 Acessar os Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Chat App** | http://localhost:3000 | Aplicação principal |
| **Prometheus** | http://localhost:9090 | Métricas e monitoramento |
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |

## 📦 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

## 📁 Estrutura do Projeto

```
.
├── src/                      # Código-fonte da aplicação
├── public/                   # Arquivos estáticos
├── data/                     # Dados persistidos
├── docker-compose.yml        # Aplicação principal
├── start-all.sh             # Script de inicialização
├── stop-all.sh              # Script de parada
└── monitoring/              # Stack de monitoramento
    ├── docker-compose.yml
    ├── scripts/
    ├── prometheus/
    └── grafana/
```

## 📖 Documentação Completa

Para documentação detalhada sobre o sistema de monitoramento, incluindo:
- Tutorial passo a passo
- Troubleshooting
- Adicionar novos hosts
- Configuração avançada

Consulte: **[monitoring/README.md](monitoring/README.md)**

## 🛠️ Uso Manual

Se preferir controle manual:

### 1. Iniciar Apenas a Aplicação

```bash
docker compose up -d
```

### 2. Iniciar Apenas o Monitoramento

```bash
cd monitoring
./scripts/set_cluster_env.sh
docker compose up -d
cd ..
```

## 🔍 Verificar Status

```bash
# Ver todos os containers
docker ps

# Ver logs da aplicação
docker compose logs -f app

# Ver logs do monitoramento
cd monitoring && docker compose logs -f && cd ..
```

## ❓ Troubleshooting

### Porta em uso

Se receber erro "port already in use":

```bash
# Verificar o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :9090
sudo lsof -i :3001

# Parar os serviços conflitantes ou mudar as portas
```

### Containers não iniciam

```bash
# Ver logs detalhados
docker compose logs

# Reiniciar tudo
./stop-all.sh
./start-all.sh
```

### Prometheus não encontra métricas

```bash
# Reconfigurar e reiniciar
cd monitoring
./scripts/set_cluster_env.sh
docker compose restart prometheus
cd ..
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
1. Fazer fork do projeto
2. Criar uma branch para sua feature
3. Commitar suas mudanças
4. Push para a branch
5. Abrir um Pull Request

## 📄 Licença

MIT License
