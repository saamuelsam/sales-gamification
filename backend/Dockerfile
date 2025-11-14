FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x node_modules/.bin/* && npm run build

EXPOSE 4000
CMD ["npm", "start"]
