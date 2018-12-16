/**
 * @Constructor
 * @variable DockerSandbox
 * @description This constructor stores all the arguments needed to prepare and execute a Docker Sandbox
 * @param {Number} timeout_value: The Time_out limit for code execution in Docker
 * @param {String} path: The current working directory where the current API folder is kept
 * @param {String} folder: The name of the folder that would be mounted/shared with Docker container, this will be concatenated with path
 * @param {String} vm_name: The TAG of the Docker VM that we wish to execute
 * @param {String} compiler_name: The compiler/interpretor to use for carrying out the translation
 * @param {String} file_name: The file_name to which source code will be written
 * @param {String} code: The actual code
 * @param {String} output_command: Used in case of compilers only, to execute the object code, send " " in case of interpretors
 * @param {String} languageName:  Language name
 * @param {String} e_arguments:  Additional argument only needed for compilers, to execute the object code
 * @param {String} stdin_data: Input data
 * @param {String} host_path: The path to the temp directory on the host system
 */
var DockerSandbox = function (timeout_value, path, folder, vm_name, compiler_name, file_name, code, output_command, languageName, e_arguments, stdin_data, host_path) {
  this.timeout_value = timeout_value;
  this.path = path;
  this.folder = folder;
  this.vm_name = vm_name;
  this.compiler_name = compiler_name;
  this.file_name = file_name;
  this.code = code;
  this.output_command = output_command;
  this.langName = languageName;
  this.extra_arguments = e_arguments;
  this.stdin_data = stdin_data;
  this.host_path = host_path;
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
    await fs.writeFile(`${sandbox.path}${sandbox.folder}/${sandbox.file_name}`, sandbox.code);
    console.log(sandbox.langName + " file was saved!");
    await exec(`chmod 777 '${sandbox.path}${sandbox.folder}/${sandbox.file_name}'`);
    await fs.writeFile(`${sandbox.path}${sandbox.folder}/inputFile`, sandbox.stdin_data);
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

  var counter = 0;
  var sandbox = this;
  var command = `docker run --rm -d --stop-timeout ${this.timeout_value} -i -t --network none -v "${this.host_path}":/usercode ${this.vm_name} /usercode/script.sh ${this.compiler_name} ${this.file_name} ${this.output_command} ${this.extra_arguments}`;
  console.log(command);
  exec(command);

  var readInterval = setInterval(() => {
    counter = counter + 1;
    readFileAsync(`${sandbox.path}${sandbox.folder}/completed`, 'utf-8')
      .then((data) => approveResult(data))
      .catch(() => {
        if (counter >= sandbox.timeout_value)
          timeoutAction();
      });
  }, 1000);

  var approveResult = function (data) {
    readFileAsync(`${sandbox.path}${sandbox.folder}/time`, 'utf8')
      .then((time) => readErrorFile(data, time, ""))
      .catch((err) => console.log(err));

    stopInterval(readInterval);
  };

  var timeoutAction = function () {
    console.log(`Timed Out: ${sandbox.folder} ${sandbox.langName}`);
    var time = -1;

    readFileAsync(`${sandbox.path}${sandbox.folder}/logfile.txt`, 'utf8')
      .then((time) => readErrorFile(data, time, "Execution Timed Out"))
      .catch(() => success("", time, "Execution Timed Out"));

    stopInterval(readInterval);
  };

  var readErrorFile = function (data, time, additionalErrorData) {
    readFileAsync(`${sandbox.path}${sandbox.folder}/errors`, 'utf8')
      .then((errorData) => success(data, time, `${errorData} \n ${additionalErrorData}`))
      .catch(() => success(data, time, additionalErrorData));
  };

  var stopInterval = function () {
    console.log(`ATTEMPTING TO REMOVE: ${sandbox.folder}`);
    exec(`rm -r ${sandbox.folder}`);
    clearInterval(readInterval);
  };

};

module.exports = DockerSandbox;
