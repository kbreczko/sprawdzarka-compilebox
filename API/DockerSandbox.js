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
 * @description Function that creates a directory with the folder name already provided through constructor
 * and then copies contents of folder named Payload to the created folder, this newly created folder will be mounted
 * on the Docker Container. A file with the name specified in file_name variable of this class is created and all the
 * code written in 'code' variable of this class is copied into this file.
 * Summary: This function produces a folder that contains the source file and 2 scripts, this folder is mounted to our
 * Docker container when we run it.
 * @param {Function pointer} success ?????
*/
DockerSandbox.prototype.prepare = function (success) {
  var exec = require('child_process').exec;
  var fs = require('fs');
  var sandbox = this;

  exec("mkdir " + this.path + this.folder + " && cp " + this.path + "/Payload/* " + this.path + this.folder + "&& chmod 777 " + this.path + this.folder, function (st) {
    fs.writeFile(sandbox.path + sandbox.folder + "/" + sandbox.file_name, sandbox.code, function (err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(sandbox.langName + " file was saved!");
        exec("chmod 777 \'" + sandbox.path + sandbox.folder + "/" + sandbox.file_name + "\'");

        fs.writeFile(sandbox.path + sandbox.folder + "/inputFile", sandbox.stdin_data, function (err) {
          if (err) {
            console.log(err);
          }
          else {
            console.log("Input file was saved!");
            success();
          }
        });


      }
    });


  });

};

/**
 * @function
 * @name DockerSandbox.execute
 * @precondition: DockerSandbox.prepare() has successfully completed
 * @description: This function takes the newly created folder prepared by DockerSandbox.prepare() and spawns a Docker container
 * with the folder mounted inside the container with the name '/usercode/' and calls the script.sh file present in that folder
 * to carry out the compilation. The Sandbox is spawned ASYNCHRONOUSLY and is supervised for a timeout limit specified in timeout_limit
 * variable in this class. This function keeps checking for the file "Completed" until the file is created by script.sh or the timeout occurs
 * In case of timeout an error message is returned back, otherwise the contents of the file (which could be the program output or log of
 * compilation error) is returned. In the end the function deletes the temporary folder and exits
 *
 * Summary: Run the Docker container and execute script.sh inside it. Return the output generated and delete the mounted folder
 *
 * @param {Function pointer} success ?????
*/

DockerSandbox.prototype.execute = function (success) {
  var exec = require('child_process').exec;
  var fs = require('fs');
  var counter = 0;
  var sandbox = this;
  var st = this.path + 'DockerTimeout.sh ' + this.timeout_value + 's -i -t --network none -v "' + this.host_path + '":/usercode ' + this.vm_name + ' /usercode/script.sh ' + this.compiler_name + ' ' + this.file_name + ' ' + this.output_command + ' ' + this.extra_arguments;

  console.log(st);

  exec(st);
  console.log("------------------------------");

  var intid = setInterval(function () {
    counter = counter + 1;

    fs.readFile(sandbox.path + sandbox.folder + '/completed', 'utf8', function (err, data) {

      if (err && counter < sandbox.timeout_value)
        return;

      else if (counter < sandbox.timeout_value) {
        console.log("DONE");

        fs.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8', function (err2, data2) {
          if (!data2) data2 = "";
          console.log("Error file: ");
          console.log(data2);

          console.log("Main File");
          console.log(data);

          var lines = data.toString().split('*-COMPILEBOX::ENDOFOUTPUT-*');
          data = lines[0];
          var time = lines[1];

          console.log("Time: ");
          console.log(time);

          success(data, time, data2)
        });

      }

      else {
        fs.readFile(sandbox.path + sandbox.folder + '/logfile.txt', 'utf8', function (err, data) {
          if (!data) data = "";
          data += "\nExecution Timed Out";
          console.log("Timed Out: " + sandbox.folder + " " + sandbox.langName);
          fs.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8', function (err2, data2) {
            if (!data2) data2 = "";

            var lines = data.toString().split('*---*');
            data = lines[0];
            var time = lines[1];

            console.log("Time: ");
            console.log(time);

            success(data, data2)
          });
        });

      }

      console.log("ATTEMPTING TO REMOVE: " + sandbox.folder);
      console.log("------------------------------");
      exec("rm -r " + sandbox.folder);

      clearInterval(intid);
    });
  }, 1000);

};


module.exports = DockerSandbox;
