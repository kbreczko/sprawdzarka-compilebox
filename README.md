# sprawdzarka-compile-box

### Wymagania:

- Docker 18.06.1-ce
- NodeJs v10.12.0
- NPM 6.4.1

### Przygotowanie obrazu dla Docker:
docker build -t 'virtual_machine' - < ./Setup/Dockerfile


### Przed uruchomieniem:
npm install ./API/  
chmod 777 ./API/DockerTimeout.sh  
chmod 777 ./API/Payload/script.sh  
chmod 777 ./API/Payload/javaRunner.sh  

### Uruchomienie:
nodejs app.js