FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependência do backend
COPY backend/package*.json ./

# Instala dependências
RUN npm ci
RUN chmod +x ./node_modules/.bin/* || true

# Copia TODO o código do backend (inclui src, tsconfig, etc)
COPY backend/. .

# Verifica se o entrypoint.sh está no lugar certo
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Verifica se o tsconfig está no /app
RUN ls -la /app/tsconfig.json  # remove depois de testar

EXPOSE 4000
CMD ["/app/entrypoint.sh"]
