FROM node:11.4.0-slim
MAINTAINER Kamil Breczko, Mateusz Pater

RUN curl -sSL https://get.docker.com/ | sh

COPY ./API /usr/local/src/API
COPY ./LICENSE /usr/local/src/LICENSE

RUN npm install /usr/local/src/API/
RUN chmod 777 /usr/local/src/API/Payload/script.sh
RUN chmod 777 /usr/local/src/API/Payload/javaRunner.sh

ENTRYPOINT node /usr/local/src/API/app.js