const uploader = require('./fileUpload');

const upload = (config) => {
  uploader({ ...config, sourceDir: 'dist/build/h5' });
};

module.exports = { upload };
