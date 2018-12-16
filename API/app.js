var express = require('express');
var http = require('http');
var arr = require('./compilers');
var sandBox = require('./DockerSandbox');
var bodyParser = require('body-parser');
var app = express();
var server = http.createServer(app);
var port = 8080;

var MAX_CONTAINERS_COUNT = 1;
var containersCount = 0;


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
  var hostPath = process.env.TMP_PATH ? process.env.TMP_PATH + "/" + index : path + folder;
  var vmName = 'kamilbreczko/sprawdzarka:virtual_machine';
  var timeout = 60;

  var sandboxType = new sandBox(timeout, path, folder, vmName, arr.compilerArray[language][0], arr.compilerArray[language][1], code, arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4], stdin, hostPath);

  (function continueExec() {

    if(containersCount >= MAX_CONTAINERS_COUNT){
      setTimeout(continueExec, 1000);
      return;
    }

    containersCount = containersCount + 1;

    sandboxType.run(function (output, time, error) {
      containersCount = containersCount - 1;

      console.log(`------------------`);
      console.log(`Time: ${time}`);
      console.log(`Main File: \n ${output}`);
      console.log(`Error file \n ${error}`);
      console.log(`------------------`);

      res.send({output: output, language: language, code: code, error: error, time: time});
    });
  })();
});

console.log("Listening at " + port);
server.listen(port);
