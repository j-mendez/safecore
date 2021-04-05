FROM node:10.4.0

COPY . .

RUN npm install
RUN bash ./bootstrap.sh

ENV MUMBLE_URL=127.0.0.1:64738

CMD MUMBLE_URL=${MUMBLE_URL} npm run dev