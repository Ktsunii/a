#!/bin/bash

# Script para iniciar aplicação e monitoramento
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Iniciando Aplicação Principal ===${NC}"
docker compose up -d
echo -e "${GREEN}✓ Aplicação iniciada${NC}\n"

echo -e "${YELLOW}=== Configurando Monitoramento ===${NC}"
cd monitoring
chmod +x scripts/set_cluster_env.sh
./scripts/set_cluster_env.sh
echo ""

echo -e "${YELLOW}=== Iniciando Stack de Monitoramento ===${NC}"
docker compose up -d
cd ..
echo -e "${GREEN}✓ Monitoramento iniciado${NC}\n"

echo -e "${GREEN}=== Todos os serviços iniciados com sucesso! ===${NC}"
echo -e "Aplicação:  http://localhost:3000"
echo -e "Prometheus: http://localhost:9090"
echo -e "Grafana:    http://localhost:3001 (admin/admin)"
