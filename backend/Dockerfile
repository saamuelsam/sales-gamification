FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci && \
    chmod -R 755 /app/node_modules/.bin

# Copiar código fonte
COPY . .

# Copiar e dar permissão ao entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expor porta
EXPOSE 4000

# Usar o entrypoint personalizado
CMD ["/app/entrypoint.sh"]
