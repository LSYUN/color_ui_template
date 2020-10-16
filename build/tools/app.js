/***
 * wgt builder
 */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const zip = require('jszip')();
const uploader = require('./fileUpload');

const targetPath = path.resolve(process.cwd(), 'dist/build');
const sourceDir = path.resolve(process.cwd(), 'dist/build/app-plus');

function pathJoin() {
  return Array.from(arguments).reduce((total, path) => total ? total + '/' + path : path);
}

//读取目录及文件
function readDir(zip, parentPath = '') {
  const fullParentPath = path.join(sourceDir, parentPath);
  const files = fs.readdirSync(fullParentPath);//读取目录中的所有文件及文件夹（同步操作）
  files.forEach((fileName) => {//遍历检测目录中的文件
    const fillPath = path.join(fullParentPath, fileName);
    let nextParentPath = parentPath;
    if (fs.statSync(fillPath).isDirectory()) {//如果是目录的话，继续查询
      nextParentPath = pathJoin(nextParentPath, fileName);
      zip.folder(nextParentPath);//压缩对象中生成该目录
      readDir(zip, nextParentPath);//重新检索目录文件
    } else {
      zip.file(pathJoin(nextParentPath, fileName), fs.readFileSync(fillPath));//压缩目录添加文件
    }
  });
}

//开始压缩文件
function buildWgt({ appId }) {
  readDir(zip);
  zip.generateAsync({//设置压缩格式，开始打包
    type: "nodebuffer",//nodejs用
    compression: "DEFLATE",//压缩算法
    compressionOptions: {//压缩级别
      level: 9
    }
  }).then(function (content) {
    fs.writeFileSync(`${ targetPath }/wgt.zip`, content, "utf-8");//将打包的内容写入 当前目录下的 result.zip中
    fs.renameSync(`${ targetPath }/wgt.zip`, `${ targetPath }/${ appId }.wgt`,);
    console.log(chalk.green('wgt端打包完成'));
  });
}

const upload = (config) => {
  buildWgt(config);
  uploader(config);
};

module.exports = { upload };
