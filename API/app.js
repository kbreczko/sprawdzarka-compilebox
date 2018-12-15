var express = require('express');
var http = require('http');
var arr = require('./compilers');
var sandBox = require('./DockerSandbox');
var bodyParser = require('body-parser');
var app = express();
var server = http.createServer(app);
var port = 8080;

var max_containers_count = 1;
var containers_count = 0;


app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

function random(size) {
  return require("crypto").randomBytes(size).toString('hex');
}


app.post('/compile', function (req, res) {

  var language = req.body.language;
  var code = req.body.code;
  var stdin = req.body.input;

  var index = random(10);
  var folder = 'temp/' + index;
  var path = __dirname + "/";
  var host_path = process.env.TMP_PATH ? process.env.TMP_PATH + "/" + index : path + folder;
  var vm_name = 'kamilbreczko/sprawdzarka:virtual_machine';
  var timeout_value = 60;

  var sandboxType = new sandBox(timeout_value, path, folder, vm_name, arr.compilerArray[language][0], arr.compilerArray[language][1], code, arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4], stdin, host_path);

  (function continueExec() {

    if(containers_count > max_containers_count){
      setTimeout(continueExec, 1000);
      return;
    }

    containers_count = containers_count + 1;

    sandboxType.run(function (data, exec_time, err) {
      containers_count = containers_count - 1;

      console.log(`------------------`);
      console.log(`Time: ${exec_time}`);
      console.log(`Main File: \n ${data}`);
      console.log(`Error file \n ${err}`);
      console.log(`------------------`);

      res.send({output: data, language: language, code: code, errors: err, time: exec_time});
    });
  })();
});

console.log("Listening at " + port);
server.listen(port);
