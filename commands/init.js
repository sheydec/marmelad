const fs = require('fs');

module.exports = (dir) => {
  dir = dir || '';

  if (dir.length && fs.existsSync(dir)) {
    console.log();
    console.log(`${dir} - directory is already exists`);
    console.log();
    process.exit();
  }

  if (!dir.length && fs.existsSync('marmelad/tci')) {
    console.log();
    console.log('project is already initialized');
    console.log();
    process.exit();
  }

  require('../tasks/init')(dir);
};
