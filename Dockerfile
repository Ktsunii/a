# Estágio 1: Builder - Instala dependências e compila nativos
FROM node:20-alpine AS builder

WORKDIR /app

# Ferramentas necessárias para compilar dependências nativas (ex.: better-sqlite3)
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

# Copia somente manifestos para melhor cache
COPY package.json package-lock.json* ./

# Instala somente dependências de produção de forma reproduzível
# Usando --omit=dev que é o padrão para npm moderno
RUN npm ci --omit=dev

# Copia o resto do código da aplicação
COPY . .

# Estágio 2: Final - Imagem limpa e otimizada
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copia artefatos necessários do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./

# Cria diretório para uploads e ajusta permissões
RUN mkdir -p uploads && chown -R node:node /app

# Expõe a porta que o server.js vai usar
EXPOSE 3000

# Boa prática: Não rodar como 'root'
USER node

# Comando para iniciar a aplicação
CMD ["node", "src/server.js"]