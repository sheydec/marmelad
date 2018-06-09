const fs = require('fs');

module.exports = (name, techs) => {
  const blockPath = `_blocks/${name}`;
  const extensions = techs.split(',');

  if (fs.existsSync(blockPath)) {
    console.log();
    process.stdout.write(`${blockPath} is already exists`);
  } else {
    fs.mkdirSync(blockPath);

    extensions.forEach((ext) => {
      fs.writeFileSync(`${blockPath}/${name}.${ext}`, '', { encoding: 'utf8' });
    });

    console.log();
    process.stdout.write(`${blockPath} is created`);
  }

  process.exit();
};
