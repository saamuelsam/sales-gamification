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
