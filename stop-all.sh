#!/bin/bash

# Script para parar aplicação e monitoramento
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Parando Stack de Monitoramento ===${NC}"
cd monitoring
docker compose down
cd ..
echo -e "${RED}✓ Monitoramento parado${NC}\n"

echo -e "${YELLOW}=== Parando Aplicação Principal ===${NC}"
docker compose down
echo -e "${RED}✓ Aplicação parada${NC}\n"

echo -e "${RED}=== Todos os serviços foram parados ===${NC}"
