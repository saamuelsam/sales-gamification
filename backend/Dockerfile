# Etapa 1: build do backend
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copia apenas os arquivos necessários do backend
COPY package*.json tsconfig.json ./
COPY src ./src

# Instala dependências com devDependencies
RUN npm ci --silent

# Compila o backend
RUN npx tsc -p tsconfig.json

# Etapa 2: imagem final para execução
FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

RUN npm ci --only=production --silent

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
