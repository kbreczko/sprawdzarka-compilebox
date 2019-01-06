/**
 * @Constructor
 * @variable DockerSandbox
 * @description This constructor stores all the arguments needed to prepare and execute a Docker Sandbox
 * @param {Number} timeout: The timeout limit for code execution in Docker
 * @param {String} path: The current working directory where the current API folder is kept
 * @param {String} folder: The name of the folder that would be mounted/shared with Docker container, this will be concatenated with path
 * @param {String} vmName: The TAG of the Docker VM that we wish to execute
 * @param {String} compilerName: The compiler/interpretor to use for carrying out the translation
 * @param {String} fileName: The file name to which source code will be written
 * @param {String} code: The actual code
 * @param {String} outputCommand: Used in case of compilers only, to execute the object code, send " " in case of interpretors
 * @param {String} languageName:  Language name
 * @param {String} extraArguments:  Additional argument only needed for compilers, to execute the object code
 * @param {String} stdinData: Input data
 * @param {String} hostPath: The path to the temp directory on the host system
 */
var DockerSandbox = function (timeout, path, folder, vmName, compilerName, fileName, code, outputCommand, languageName, extraArguments, stdinData, hostPath) {
  this.timeout = timeout;
  this.path = path;
  this.folder = folder;
  this.vmName = vmName;
  this.compilerName = compilerName;
  this.fileName = fileName;
  this.code = code;
  this.outputCommand = outputCommand;
  this.languageName = languageName;
  this.extraArguments = extraArguments;
  this.stdinData = stdinData;
  this.hostPath = hostPath;
};


/**
 * @function
 * @name DockerSandbox.run
 * @description Function that first prepares the Docker environment and then executes the Docker sandbox
 * @param {Function pointer} success ?????
 */
DockerSandbox.prototype.run = function (success) {
  var sandbox = this;

  this.prepare(function () {
    sandbox.execute(success);
  });
};


/**
 * @function
 * @name DockerSandbox.prepare
 * @description This function produces a folder that contains the source file, input file and 2 scripts, this folder is mounted to our Docker
 * container when we run it.
 * @param {Function pointer} success ?????
 */
DockerSandbox.prototype.prepare = function (success) {
  var util = require('util');
  var exec = util.promisify(require('child_process').exec);
  var fs = require('fs').promises;
  var sandbox = this;

  async function prepareEnvironment() {
    await exec(`mkdir ${sandbox.path}${sandbox.folder}`);
    await exec(`cp ${sandbox.path}/Payload/* ${sandbox.path}${sandbox.folder}`);
    await exec(`chmod 777 ${sandbox.path}${sandbox.folder}`);
    await fs.writeFile(`${sandbox.path}${sandbox.folder}/${sandbox.fileName}`, sandbox.code);
    console.log(sandbox.languageName + " file was saved!");
    await exec(`chmod 777 '${sandbox.path}${sandbox.folder}/${sandbox.fileName}'`);
    await fs.writeFile(`${sandbox.path}${sandbox.folder}/inputFile`, sandbox.stdinData);
    console.log("Input file was saved!");
    success();
  }

  prepareEnvironment().catch((err) => console.log(err));
};

/**
 * @function
 * @name DockerSandbox.execute
 * @precondition: DockerSandbox.prepare() has successfully completed
 * @description: Run the Docker container and execute script.sh inside it. Return the output generated and delete the mounted folder
 *
 * @param {Function pointer} success ?????
 */
DockerSandbox.prototype.execute = function (success) {
  var exec = require('child_process').exec;
  var util = require('util');
  var readFileAsync = util.promisify(require('fs').readFile);
  var fs = require('fs').promises;

  var counter = 0;
  var sandbox = this;
  var command = `docker run --rm -d --stop-timeout ${this.timeout} -i -t --network none -v "${this.hostPath}":/usercode ${this.vmName} /usercode/script.sh ${this.compilerName} ${this.fileName} ${this.outputCommand} ${this.extraArguments}`;
  console.log(command);
  exec(command);

  var readInterval = setInterval(() => {
    counter = counter + 1;
    readFileAsync(`${sandbox.path}${sandbox.folder}/completed`, 'utf-8')
      .then((output) =>
        approveResult(output)
          .catch(err => console.log(err))
          .finally(() => stopInterval(readInterval))
      )
      .catch(() => {
        if (counter >= sandbox.timeout)
          timeoutAction()
            .catch(err => console.log(err))
            .finally(() => stopInterval(readInterval));
      });
  }, 1000);

  var approveResult = async function (output) {
    var time = await fs.readFile(`${sandbox.path}${sandbox.folder}/time`, 'utf8');
    var error = await fs.readFile(`${sandbox.path}${sandbox.folder}/error`, 'utf8');
    success(output, time, error);
  };

  var timeoutAction = async function () {
    console.log(`Timed Out: ${sandbox.folder} ${sandbox.languageName}`);
    var time = -1;
    var output = await fs.readFile(`${sandbox.path}${sandbox.folder}/logfile`, 'utf8');
    var error = await fs.readFile(`${sandbox.path}${sandbox.folder}/error`, 'utf8');
    success(output, time, error);
  };

  var stopInterval = function () {
    console.log(`ATTEMPTING TO REMOVE: ${sandbox.folder}`);
    exec(`rm -r ${sandbox.folder}`);
    clearInterval(readInterval);
  };

};

module.exports = DockerSandbox;
