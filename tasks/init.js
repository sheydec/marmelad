const path = require('path');
const PKG = require('../package.json');
const gulp = require('gulp');

module.exports = (initPath) => {
  gulp.task('init:marmelad', (done) => {
    const stream = gulp.src(
      [path.join(__dirname.replace('tasks', ''), 'boilerplate', '**', '*')],
      { dot: true },
    )
      .pipe(gulp.dest(path.join(process.cwd(), initPath)));

    stream.on('end', () => {
      console.log(`\n${PKG.name.toUpperCase()} v${PKG.version} initialized\ntype ${PKG.name} --help for CLI help\n`);

      done();
    });
  });

  gulp.series('init:marmelad')();
};
