FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci
RUN chmod +x ./node_modules/.bin/* || true

# Copiar código (depois de node_modules)
COPY . .

# Entrypoint
COPY entrypoint.sh /backend/entrypoint.sh
RUN sed -i 's/\r$//' /backend/entrypoint.sh && chmod +x /backend/entrypoint.sh

EXPOSE 4000
CMD ["/backend/entrypoint.sh"]