let express = require('express');
let http = require('http');
let arr = require('./compilers');
let sandBox = require('./DockerSandbox');
const bodyParser = require('body-parser');
let app = express();
let server = http.createServer(app);
const port = 8080;

const MAX_CONTAINERS_COUNT = 1;
let containersCount = 0;


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

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    const ex = 'tut.topic';
    ch.assertExchange(ex, 'topic', {durable: true});
    ch.assertQueue('test', {exclusive: false}, function(err, q) {
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
      ch.bindQueue(q.queue, ex, '*.compile');

      ch.consume(q.queue, function(msg) {
        debugger;
        console.log(" [x] %s: took from queue '%s'", msg.fields.routingKey, msg.content);

        let language = JSON.parse(msg.content).language;
        let code = JSON.parse(msg.content).code;
        let stdin = JSON.parse(msg.content).input;

        let index = random(10);
        let folder = 'temp/' + index;
        let path = __dirname + "/";
        let hostPath = process.env.TMP_PATH ? process.env.TMP_PATH + "/" + index : path + folder;
        let vmName = 'kamilbreczko/sprawdzarka:virtual_machine';
        let timeout = 60;

        let sandboxType = new sandBox(timeout, path, folder, vmName, arr.compilerArray[language][0], arr.compilerArray[language][1], code, arr.compilerArray[language][2], arr.compilerArray[language][3], arr.compilerArray[language][4], stdin, hostPath);

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

            const routingKey = msg.fields.routingKey.replace('compile', 'result');
            const result = JSON.stringify({output: output, language: language, code: code, error: error, time: time});

            console.log('Publish on ' + routingKey + ' result: ' + result);
            ch.publish(ex, routingKey, Buffer.from(result));

          });
        })();




      }, {noAck: true});
    });
  });
});

console.log("Listening at " + port);
server.listen(port);
