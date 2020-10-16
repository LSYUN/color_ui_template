const uploader = require('./fileUpload');

const upload = (config) => {
  uploader({ ...config });
};

module.exports = { upload };
