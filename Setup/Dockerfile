FROM ubuntu:trusty
MAINTAINER Kamil Breczko, Mateusz Pater

RUN apt-get update
RUN apt-get install -y bc

# Install all the languages/compilers we are supporting.

#           PYTHON
RUN apt-get install -y python


#           C/C++
RUN apt-get install -y g++


#           JavaScipt
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN npm config set strict-ssl false
RUN npm install -g underscore request express jade shelljs passport http sys jquery lodash async mocha moment connect validator restify ejs ws co when helmet wrench brain mustache should backbone forever  debug && export NODE_PATH=/usr/local/lib/node_modules/


#           JAVA
# Prepare for Java download
RUN apt-get install -y python-software-properties
RUN apt-get install -y software-properties-common

# Grab oracle java (auto accept licence)
RUN add-apt-repository -y ppa:linuxuprising/java
RUN apt-get update
RUN echo oracle-java11-installer shared/accepted-oracle-license-v1-2 select true | /usr/bin/debconf-set-selections
RUN apt-get install -y oracle-java11-installer


#           Objective-C
RUN apt-get install -y gcc
RUN apt-get install -y gobjc
RUN apt-get install -y gnustep-devel &&  sed -i 's/#define BASE_NATIVE_OBJC_EXCEPTIONS     1/#define BASE_NATIVE_OBJC_EXCEPTIONS     0/g' /usr/include/GNUstep/GNUstepBase/GSConfig.h
