const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const CMD = require('cmd-exec').init();

function run(options) {
  const opts = Object.assign({
    usePolling: true,
  }, options);

  const tciFilePath = path.join('marmelad', 'tci');
  const TCIWatcher = chokidar.watch(tciFilePath, opts);

  TCIWatcher.on('change', (file) => {
    const text = fs.readFileSync(file, { encoding: 'utf8' }).replace(/\n+$/m, '');
    const commands = text.split('\n').map(item => `mmd ${item}`);

    CMD
      .exec(commands.join(' && '))
      .then((res) => {
        console.log(res.message);
      })
      .fail((err) => {
        console.log(err.message);
      })
      .done(() => {
        console.log();
      });
  });
}

module.exports = {
  run,
};
