FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm ci

# Código
COPY . .

# Entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 4000

CMD ["/app/entrypoint.sh"]
