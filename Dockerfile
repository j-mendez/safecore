FROM node:10.4.0

COPY . .

RUN npm install
RUN bash ./bootstrap.sh

CMD  [ "npm", "run", "dev" ]