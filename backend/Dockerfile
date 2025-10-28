FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci
RUN chmod +x ./node_modules/.bin/* || true

COPY backend/. .

COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 4000
CMD ["/app/entrypoint.sh"]
