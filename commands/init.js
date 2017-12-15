const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join('marmelad', 'tci'))) {
  console.log();
  console.log('project is already initialized');

  process.exit();
}

require('../tasks/init');
