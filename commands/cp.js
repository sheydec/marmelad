const fs = require('fs');

module.exports = (name) => {
  const pagePath = `_pages/${name}.html`;

  if (fs.existsSync(pagePath)) {
    console.log();
    process.stdout.write(`page ${pagePath} is already exists`);
  } else {
    fs.writeFileSync(pagePath, '', { encoding: 'utf8' });
    console.log();
    process.stdout.write(`page ${pagePath} is created`);
  }

  process.exit();
};
