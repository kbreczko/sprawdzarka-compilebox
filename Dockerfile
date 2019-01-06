FROM ubuntu:latest
MAINTAINER Kamil Breczko, Mateusz Pater

RUN rm -rf /var/lib/apt/lists/*
RUN apt-get update

RUN apt-get install -y docker.io
RUN apt-get install -y npm
RUN apt-get update -yq \
    && apt-get install curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install nodejs -yq


COPY ./API /usr/local/src/API
COPY ./LICENSE /usr/local/src/LICENSE

RUN npm install /usr/local/src/API/
RUN chmod 777 /usr/local/src/API/Payload/script.sh
RUN chmod 777 /usr/local/src/API/Payload/javaRunner.sh

ENTRYPOINT node /usr/local/src/API/app.js