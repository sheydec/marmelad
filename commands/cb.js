const fs = require('fs');
const path = require('path');

module.exports = (name, techs) => {
  const blockPath = path.join('marmelad', '_blocks', name);
  const extensions = techs.split(',');

  if (fs.existsSync(blockPath)) {
    console.log();
    process.stdout.write(`block ${blockPath} is already exists`);
  } else {
    fs.mkdirSync(blockPath);

    extensions.forEach((ext) => {
      fs.writeFileSync(path.join(blockPath, `${name}.${ext}`), '', { encoding: 'utf8' });
    });

    process.stdout.write(`block ${blockPath} is created`);
  }

  process.exit();
};
