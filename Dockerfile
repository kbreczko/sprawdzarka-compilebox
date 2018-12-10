FROM ubuntu:latest
MAINTAINER Kamil Breczko, Mateusz Pater

RUN rm -rf /var/lib/apt/lists/*
RUN apt-get update

RUN apt-get install -y docker.io
RUN apt-get install -y nodejs
RUN apt-get install -y npm

COPY ./API /usr/local/etc/API
COPY ./LICENSE /usr/local/etc/LICENSE

RUN npm install /usr/local/etc/API/
RUN chmod 777 /usr/local/etc/API/DockerTimeout.sh
RUN chmod 777 /usr/local/etc/API/Payload/script.sh
RUN chmod 777 /usr/local/etc/API/Payload/javaRunner.sh

CMD node /usr/local/etc/API/app.js
