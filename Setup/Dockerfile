FROM ubuntu:latest
MAINTAINER Kamil Breczko, Mateusz Pater

RUN rm -rf /var/lib/apt/lists/*
RUN apt-get update
RUN apt-get install -y bc

# Install all the languages/compilers we are supporting.

#           PYTHON
RUN apt-get install -y python


#           C/C++
RUN apt-get install -y g++


#           JavaScipt
RUN apt-get install -y nodejs

#           JAVA
# Prepare for Java download
RUN apt-get install -y software-properties-common

# Grab oracle java (auto accept licence)
RUN add-apt-repository -y ppa:linuxuprising/java
RUN apt-get update
RUN echo oracle-java11-installer shared/accepted-oracle-license-v1-2 select true | /usr/bin/debconf-set-selections
RUN apt-get install -y oracle-java11-installer


#           Objective-C
RUN apt-get install -y gcc
RUN apt-get install -y gobjc