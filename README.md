# sprawdzarka-compile-box
Serwer postawiony na nodejs i obsługujący żądania POST od **sprawdzarka-back-end**. Aplikacja służy do kompilowania i uruchomiania niezaufanego kodu. Compilebox korzysta z dockera, dzięki czemu możemy skompilować nasz program na całkowicie odrębnym środowisku. Przy każdym żądaniu będzie stawiany kontener z gotowego obrazu systemu. 

Cechy/ograniczenia:
- w jednym czasie może uruchomić maksymalnie 1 kontener, aby nie zaburzyć pracy uruchomionych programów
- maksymalny czas pracy kontenera to 1m
- wsparcie dla języków: javascript, java, c/c++, bash, python
- pomiar czasu uruchomionego programu w ms

Model przyjmowany:  
`{code: "String", input: "String", language: Integer}`  

Model zwracany:  
`{code: "String", input: "String", language: Integer, output: "String", time: Long, error:"String"}`  

Technologie:
- express-js

## Uruchomienie bez Dockera

#### Wymagania:
- Docker 18.06.1-ce
- NodeJs v10.12.
- NPM 6.4.1

### Przygotowanie obrazu:
`docker build -t kamilbreczko/sprawdzarka:virtual_machine ./Setup/`

### Przed uruchomieniem:
`npm install ./API/`       
`chmod 777 ./API/Payload/script.sh`    
`chmod 777 ./API/Payload/javaRunner.sh`    

### Uruchomienie:
`nodejs app.js`

## Uruchomienie z Dockerem

#### Wymagania:
- Docker 18.06.1-ce

### Przygotowanie obrazu:
`docker build -t kamilbreczko/sprawdzarka:virtual_machine ./Setup/`  
`docker build -t kamilbreczko/sprawdzarka:compilebox .`  

### Przed uruchomieniem:
`mkdir -p /usr/local/etc/sprawdzarka/mysql`  
`mkdir -p /usr/local/etc/sprawdzarka/tmp`  

### Uruchomienie:
`docker run -it -p 8080:8080 -v /var/run/docker.sock:/var/run/docker.sock -v /usr/local/etc/sprawdzarka/tmp:/usr/local/src/API/temp -e TMP_PATH="/usr/local/etc/sprawdzarka/tmp" --name compilebox kamilbreczko/sprawdzarka:compilebox`

