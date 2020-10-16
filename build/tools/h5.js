const uploader = require('./fileUpload');

const upload = (config) => {
  config.server.sourceDir = 'dist/build/h5';
  uploader({ ...config });
};

module.exports = { upload };
