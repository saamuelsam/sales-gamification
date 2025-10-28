FROM node:20-alpine

WORKDIR /app

# Copia apenas os manifests do backend para instalar deps
COPY backend/package*.json ./

# Instala dependências do backend
RUN npm ci
RUN chmod +x ./node_modules/.bin/* || true

# Copia o código do backend para a imagem
COPY backend/. .

# Copia o entrypoint da raiz do repo (ajuste o caminho se mudou de lugar)
COPY ../entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 4000
CMD ["/app/entrypoint.sh"]
