const config = require('./deploy.json');
const tools = require('./tools/index.js');

const { weixin: weixinConfig, alipay: alipayConfig, app: appConfig, h5: h5Config } = config;
const { weixinTool, alipayTool, appTool, h5 } = tools;

weixinTool.upload({ ...weixinConfig, });

alipayTool.upload({ ...alipayConfig });

appTool.upload({ ...appConfig });

h5.upload({ ...h5Config });

