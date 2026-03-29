FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install --production

EXPOSE 3000
