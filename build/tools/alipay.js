/***
 * alipay code uploader
 */

const fs = require('fs');
const path = require('path');
const alipaydev = require('alipay-dev');

const readFile = (privateKeyPath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(process.cwd(), privateKeyPath), (err, data) => {
      if (err) {
        console.error('read file error:', err);
        reject();
        return;
      }
      resolve(data.toString());
    });
  });
};

// 代码上传
const upload = async (config) => {
  const { appId, version, desc = undefined, sourceDir, server: { toolId, privateKeyPath } } = config;

  let privateKey = await readFile(privateKeyPath);
  if (!privateKey) return;

  // 初始化配置
  alipaydev.setConfig({
    toolId,
    privateKey,
  });
  const uploadResult = await alipaydev.miniUpload({
    appId,
    project: path.resolve(process.cwd(), sourceDir),
    packageVersion: version,
    clientType: 'alipay',
    experience: true,
    onProgressUpdate(info) {
      // const { status, data } = info;
      // console.log('onProgressUpdate', status, data)
    }
  }).catch(e => {
    console.log('支付宝端上传异常：', e);
  });
  console.log('支付宝端上传结果：', uploadResult)
};

module.exports = { upload };
