FROM node:10

COPY . .

RUN npm install
RUN bash ./bootstrap.sh

CMD  ["npm", "run", "dev" ]