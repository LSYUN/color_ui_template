/***
 * upload files to server
 */

const fs = require("fs");
const path = require('path');
const util = require("util");
const events = require("events");
const { spawn } = require('child_process');
const { Client } = require("ssh2");

/**
 * 描述：连接远程电脑
 * 参数：server 远程电脑凭证；then 回调函数
 * 回调：then(conn) 连接远程的client对象
 */
function Connect(server, then) {
  var conn = new Client();
  conn.on("ready", function () {
    then(conn);
  }).on('error', function (err) {
    console.log("connect error!", err);
  }).on('end', function () {
    console.log("connect end!");
  }).on('close', function (had_error) {
    console.log("connect close");
  }).connect(server);
}

/**
 * 描述：运行shell命令
 * 参数：server 远程电脑凭证；cmd 执行的命令；then 回调函数
 * 回调：then(err, data) ： data 运行命令之后的返回数据信息
 */
function Shell(server, cmd, then) {
  Connect(server, function (conn) {
    conn.shell(function (err, stream) {
      if (err) {
        then(err);
      } else {// end of if
        var buf = "";
        stream.on('close', function () {
          conn.end();
          then(err, buf);
        }).on('data', function (data) {
          buf = buf + data;
        }).stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });
        stream.end(cmd);
      }
    });
  });
}

/**
 * 描述：获取windows上的文件目录以及文件列表信息
 * 参数：localDir 本地路径，
 *       dirs 目录列表
 *       files 文件列表
 */
function GetFileAndDirList(localDir, dirs, files) {
  console.log('GetFileAndDirList', localDir);
  var dir = fs.readdirSync(localDir);
  for (var i = 0; i < dir.length; i++) {
    var p = path.join(localDir, dir[i]);
    var stat = fs.statSync(p);
    if (stat.isDirectory()) {
      dirs.push(p);
      GetFileAndDirList(p, dirs, files);
    } else {
      files.push(p);
    }
  }
}

/**
 * 描述：控制上传或者下载一个一个的执行
 */
function Control() {
  events.EventEmitter.call(this);
}

util.inherits(Control, events.EventEmitter); // 使这个类继承EventEmitter

var control = new Control();

control.on("donext", function (todos, then) {
  if (todos.length > 0) {
    var func = todos.shift();
    func(function (err, result) {
      if (err) {
        throw err;
        then(err);
      } else {
        control.emit("donext", todos, then);
      }
    });
  } else {
    then(null);
  }
});

/**
 * 描述：上传文件
 * 参数：server 远程电脑凭证；localPath 本地路径；remotePath 远程路径；then 回调函数
 * 回调：then(err, result)
 */
function UploadFile(server, localPath, remotePath, then) {
  Connect(server, function (conn) {
    conn.sftp(function (err, sftp) {
      if (err) {
        then(err);
      } else {
        sftp.fastPut(localPath, remotePath, function (err, result) {
          conn.end();
          then(err, result);
        });
      }
    });
  });
}

/**
 * 描述：上传文件夹到远程目录
 * 参数：server 远程电脑凭证；
 *       localDir 本地路径，
 *       remotePath 远程路径；
 *       then 回调函数
 * 回调：then(err)
 */
function uploadDir(server, localDir, remoteDir, then) {
  var dirs = [];
  var files = [];
  GetFileAndDirList(localDir, dirs, files);

  // 创建远程目录
  var todoDir = [];
  dirs.forEach(function (dir) {
    todoDir.push(function (done) {
      var to = path.join(remoteDir, dir.slice(localDir.length)).replace(/[\\]/g, '/');
      var cmd = "mkdir -p " + to + "\r\nexit\r\n";
      console.log('cmd', cmd);
      Shell(server, cmd, done);
    })// end of push
  });

  // 上传文件
  var todoFile = [];
  files.forEach(function (file) {
    todoFile.push(function (done) {
      var to = path.join(remoteDir, file.slice(localDir.length)).replace(/[\\]/g, '/');
      console.log("upload " + to);
      UploadFile(server, file, to, done);
    });
  });

  control.emit("donext", todoDir, function (err) {
    if (err) {
      throw err;
    } else {
      control.emit("donext", todoFile, then);
    }
  });

}

function uploader(config) {
  let { server: { host, port, username, password }, sourceDir, targetDir } = config;

  const chmod = spawn('chmod', ['-R', '777', path.resolve(process.cwd(), sourceDir)]);

  chmod.on('exit', function (code, signal) {
    console.log('auth success');
    var server = {
      host,
      port,
      username,
      password
    };
    uploadDir(server, sourceDir + '/', targetDir, function (err) {
      if (err) throw err;
      console.log('success')
    });
  });
  chmod.on('error', (err) => {
    console.error('启动子进程失败', err);
  });

}

module.exports = uploader;
