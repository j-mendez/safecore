FROM node:10

COPY . .

RUN npm ci

RUN openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

CMD ["npm", "run", "dev"]