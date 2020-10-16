/***
 * weixin miniprogram code uploader
 */

const path = require('path');
const ci = require('miniprogram-ci');

// 代码上传
const upload = (config) => {
  const { appId, version, desc = undefined, sourceDir, server: { privateKeyPath } } = config;
  (async () => {
    const project = new ci.Project({
      appid: appId,
      type: 'miniProgram',
      projectPath: path.resolve(process.cwd(), sourceDir),
      privateKeyPath: path.resolve(process.cwd(), privateKeyPath),
      ignores: ['node_modules/**/*'],
    });
    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      setting: {
        es6: true,
      },
      onProgressUpdate: console.log,
    });
    console.log('微信端上传结果：', uploadResult)
  })();
};

module.exports = { upload };
