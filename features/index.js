const _ = require('lodash');
const fs = require('fs');
const currentDirectory = __dirname;
const FILE_TO_REMOVE_FROM_ARR = 'index.js';

function initAllFeatures(app) {
  const allDirsAndFiles = fs.readdirSync(currentDirectory);
  const dirsAndFilesOfInterest = _.chain(allDirsAndFiles)
    .without(FILE_TO_REMOVE_FROM_ARR)
    .sortBy((a, b) => a-b)
    .value();
    
  _.each(dirsAndFilesOfInterest, item => {
    const file = require(`./${item}`);
    app.use(file.init);
  });
};

module.exports = {
  init: initAllFeatures
};