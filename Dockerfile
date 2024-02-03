FROM node:20.11.0-alpine3.19

RUN apk update && apk add kubectl

RUN mkdir -p /app
WORKDIR /app
ADD . /app
RUN npm install --production

CMD ["./start.sh"]


