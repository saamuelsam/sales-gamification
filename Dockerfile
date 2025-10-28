# Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copia os manifests do backend
COPY backend/package*.json ./

# Instala dependências do backend
RUN npm ci
RUN chmod +x ./node_modules/.bin/* || true

# Copia todo o código do backend
COPY backend/. .

# Copia o entrypoint.sh da raiz
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 4000
CMD ["/app/entrypoint.sh"]
