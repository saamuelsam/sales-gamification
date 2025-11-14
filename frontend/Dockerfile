FROM node:20-alpine AS build

WORKDIR /app

# Variável de ambiente para build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .

# Limpar todos os caches antes do build
RUN rm -rf node_modules/.vite dist .vite

# Build com variáveis de ambiente explícitas
RUN VITE_API_URL=/api npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
