const path = require('path');
const PKG = require('../package.json');
const gulp = require('gulp');

gulp.task('init:marmelad', (done) => {
  const stream = gulp.src(
    [path.join(__dirname.replace('tasks', ''), 'boilerplate', '**', '*')],
    { dot: true },
  )
    .pipe(gulp.dest(path.join(process.cwd(), 'marmelad')));

  stream.on('end', () => {
    console.log(`\n${PKG.name.toUpperCase()} v${PKG.version} initialized\n\ntype ${PKG.name} --help for CLI help`);

    done();
  });
});

gulp.series('init:marmelad')();
