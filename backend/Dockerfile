# backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 4000

# Comando padrão
CMD ["npm", "run", "dev"]

# Copiar script de entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Usar o entrypoint personalizado
CMD ["/app/entrypoint.sh"]
