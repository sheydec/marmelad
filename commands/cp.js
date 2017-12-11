const fs = require('fs');
const path = require('path');

module.exports = (name) => {
  const pagePath = path.join('marmelad', '_pages', `${name}.html`);

  if (fs.existsSync(pagePath)) {
    console.log();
    process.stdout.write(`page ${pagePath} is already exists`);
  } else {
    fs.writeFileSync(pagePath, '', { encoding: 'utf8' });
    process.stdout.write(`page ${pagePath} is created`);
  }

  process.exit();
};
