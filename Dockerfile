FROM bitnami/kubectl:1.20.9 as kubectl
FROM node:20.11.0-alpine3.19

COPY --from=kubectl /opt/bitnami/kubectl/bin/kubectl /usr/local/bin/

RUN mkdir -p /app
WORKDIR /app
ADD . /app
RUN npm install --production

CMD ["./start.sh"]


