const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const chalk = require('chalk');
const glob = require('glob');

const gulp = require('gulp');
const rename = require('gulp-rename');

const bsSP = require('browser-sync').create();
const tap = require('gulp-tap');
const iconizer = require('../modules/gulp-iconizer');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const nunjucks = require('../modules/gulp/nunjucks');
const frontMatter = require('gulp-front-matter');

const postHTML = require('gulp-posthtml');
const svgSprite = require('gulp-svg-sprite');

const sassGlob = require('gulp-sass-glob');
const sass = require('gulp-sass');
const stylus = require('gulp-stylus');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const focus = require('postcss-focus');
const flexBugsFixes = require('postcss-flexbugs-fixes');
const momentumScrolling = require('postcss-momentum-scrolling');
const easingGradients = require('postcss-easing-gradients');
const inlineSvg = require('postcss-inline-svg');
const autoprefixer = require('autoprefixer');

const sourcemaps = require('gulp-sourcemaps');
const gif = require('gulp-if');

const log = require('fancy-log');

const plumber = require('gulp-plumber');
const groupMQ = require('gulp-group-css-media-queries');
const changed = require('gulp-changed');
const concat = require('gulp-concat');
const include = require('gulp-include');

const pipeErrorStop = require('pipe-error-stop');
const del = require('del');

const db = new (require('../modules/database'))();

const getAuthParams = params => (typeof params !== 'string' ? [pkg.name, false] : params.split('@'));
const getIconsNamesList = iconsPath => fs.readdirSync(iconsPath).map(iconName => iconName.replace(/.svg/g, ''));
const getNunJucksBlocks = blocksPath => fs.readdirSync(blocksPath).map(el => `${blocksPath}/${el}`);


module.exports = (OPTS) => {
  /**
   * Проверка правильности установки логина и пароля для авторизации
   */
  bsSP.use(require('bs-auth'), {
    user: getAuthParams(OPTS.auth)[0],
    pass: getAuthParams(OPTS.auth)[1],
    use: OPTS.auth,
  });

  const settings = require(path.join(process.cwd(), 'settings.js'));

  const postcssPlugins = [
    momentumScrolling(),
    focus(),
    flexBugsFixes(),
    inlineSvg(),
    easingGradients(),
    autoprefixer(settings.AUTOPREFIXER),
  ];

  let isNunJucksUpdate = false;

  /**
   * NUNJUCKS
   */
  gulp.task('nunjucks', (done) => {
    log('nunjucks start');

    let templateName = '';

    const stream = gulp.src(settings.SETUP.pages.src)
      .pipe(plumber())
      .pipe(gif(!isNunJucksUpdate, changed(settings.SETUP.pages.dest)))
      .pipe(tap((file) => {
        templateName = path.basename(file.path);
      }))
      .pipe(frontMatter())
      .pipe(nunjucks({
        searchPaths: getNunJucksBlocks(settings.FOLDERS.blocks),
        locals: db.store,
        ext: '.html',
        setUp(env) {
          env.addFilter('limitto', require('../modules/nunjucks/limitto'));
          return env;
        },
      }))
      .pipe(pipeErrorStop({
        errorCallback: (err) => {
          log.error(`${chalk.red(err.message)} in ${chalk.yellow(templateName)}`);
        },
        successCallback: () => {
          isNunJucksUpdate = false;
        },
      }))
      .pipe(postHTML([
        require('posthtml-bem')(settings.BEML),
      ]))
      .pipe(gulp.dest(settings.SETUP.pages.dest));

    stream.on('end', () => {
      log('nunjucks end');
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * project styles
   */
  gulp.task('styles', (done) => {
    const { styles } = settings.SETUP;

    gulp.src(styles.src)
      .pipe(plumber())
      .pipe(gif('*.styl', stylus({
        'include css': true,
        // rawDefine : { $data }
      })))
      .pipe(gif('*.less', less()))
      .pipe(gif('*.scss', sassGlob()))
      .pipe(gif('*.scss', sass()))
      .pipe(gif('*.sass', sass({
        indentedSyntax: true,
      })))
      .pipe(groupMQ())
      .pipe(postcss(postcssPlugins))
      .pipe(gulp.dest(styles.dest))
      .pipe(bsSP.stream());

    log('styles done');

    done();
  });

  /**
   * Iconizer
   */
  gulp.task('iconizer', (done) => {
    const stream = gulp.src(path.join(settings.paths.iconizer.icons, '*.svg'))
      .pipe(svgSprite(settings.app.svgSprite))
      .pipe(gulp.dest('.'));

    stream.on('end', () => {
      Object.assign(database.app, {
        icons: getIconsNamesList(settings.paths.iconizer.icons),
      });

      log(`Iconizer ............................ ${chalk.bold.green('Done')}`);

      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * Iconizer update
   */
  gulp.task('iconizer:update', (done) => {
    isNunJucksUpdate = true;
    gulp.series('iconizer', 'db:update')(done);
  });


  /**
   * scripts from blocks
   */
  gulp.task('scripts:others', (done) => {
    const stream = gulp.src(path.join(settings.paths.js.src, '*.js').replace(/\\/g, '/'))
      .pipe(plumber())
      .pipe(include({
        extensions: 'js',
        hardFail: false,
      })).on('error', log)
      .pipe(babel({
        presets: ['babel-preset-env'].map(require.resolve),
        plugins: ['babel-plugin-transform-object-assign'].map(require.resolve),
        babelrc: false,
      }))
      .pipe(rename({
        dirname: '',
      }))
      .pipe(gulp.dest(path.join(settings.paths.storage, settings.folders.js.src)));

    stream.on('end', () => {
      log(`Scripts others ...................... ${chalk.bold.green('Done')}`);
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * СКРИПТЫ ВЕНДОРНЫЕ
   */
  gulp.task('scripts:vendors', (done) => {
    const vendorsDist = path.join(
      settings.paths.storage,
      settings.folders.js.src,
      settings.folders.js.vendors,
    );

    const stream = gulp.src(path.join(settings.paths.js.vendors, '**', '*.js').replace(/\\/g, '/'))
      .pipe(plumber())
      .pipe(changed(vendorsDist))
      .pipe(rename({
        dirname: '',
      }))
      .pipe(gulp.dest(vendorsDist));

    stream.on('end', () => {
      log(`Scripts vendors ..................... ${chalk.bold.green('Done')}`);
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * СКРИПТЫ ПЛАГИНОВ
   */
  gulp.task('scripts:plugins', (done) => {
    const stream = gulp.src(path.join(settings.paths.js.plugins, '**', '*.js').replace(/\\/g, '/'))
      .pipe(plumber())
      .pipe(concat('plugins.min.js'))
      .pipe(uglify())
      .pipe(rename({
        dirname: '',
      }))
      .pipe(gulp.dest(path.join(settings.paths.storage, settings.folders.js.src)));

    stream.on('end', () => {
      log(`Scripts plugins ..................... ${chalk.bold.green('Done')}`);
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * СТИЛИ ПЛАГИНОВ
   */
  gulp.task('styles:plugins', (done) => {
    gulp.src(path.join(settings.paths.js.plugins, '**', '*.css').replace(/\\/g, '/'))
      .pipe(plumber())
      .pipe(concat('plugins.min.css'))
      .pipe(groupMQ())
      .pipe(postcss([
        focus(),
        flexBugsFixes(),
      ]))
      .pipe(gulp.dest(path.join(settings.paths.storage, 'css')))
      .on('end', () => {
        log(`Plugins CSS ......................... ${chalk.bold.green('Done')}`);
      })
      .pipe(bsSP.stream());

    done();
  });

  /**
   * Root Files
   */
  gulp.task('root', (done) => {
    const { root } = settings.SETUP;

    const stream = gulp.src(root.src)
      .pipe(plumber())
      .pipe(changed(root.dest))
      .pipe(gulp.dest(root.dest));

    stream.on('end', () => {
      log('root files done');
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  /**
   * static server
   */
  gulp.task('server', (done) => {
    bsSP.init(settings.SERVER, () => {
      // const bsAuth = bsSP.getOption('bsAuth');

      // let authString = '';

      // if (bsAuth && bsAuth.use) {
      //   authString = `\n\nuser: ${bsAuth.user}\npass: ${bsAuth.pass}`;
      // }

      // console.log(boxen(`${chalk.bold.yellow(pkg.name.toUpperCase())} v${pkg.version} is Started!${authString}`, {
      //   padding: 1,
      //   margin: 0,
      //   borderStyle: 'double',
      //   borderColor: 'green',
      // }));

      done();
    });
  });

  gulp.task('bootstrap:scss', (done) => {
    const { bootstrap } = settings.SETUP;

    log('bootstrap scss start');

    gulp.src(bootstrap.scss.src)
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass(bootstrap.scss.opts))
      .pipe(postcss([
        autoprefixer(settings.AUTOPREFIXER),
      ]))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(bootstrap.scss.dest))
      .on('end', () => {
        log('bootstrap scss finish');
      })
      .pipe(bsSP.stream());

    done();
  });

  gulp.task('bootstrap:js', (done) => {
    const { bootstrap } = settings.SETUP;

    const stream = gulp.src(bootstrap.js.src)
      .pipe(plumber())
      .pipe(changed(path.join(bootstrap.js.dest)))
      .pipe(gulp.dest(bootstrap.js.dest));

    stream.on('end', () => {
      log('bootstrap js done');
      bsSP.reload();
      done();
    });

    stream.on('error', (err) => {
      done(err);
    });
  });

  gulp.task('watch', (done) => {
    const { SETUP } = settings;

    // watch for nunjucks pages
    gulp.watch(
      SETUP.pages.watch,
      SETUP.watchOpts,
      gulp.parallel('nunjucks'),
    );

    // watch for nunjucks blocks
    gulp.watch(
      SETUP.blocks.watch,
      SETUP.watchOpts,
      (complete) => {
        isNunJucksUpdate = true;
        gulp.series('nunjucks')(complete);
      },
    );

    // watch for bootstrap js
    gulp.watch(
      SETUP.bootstrap.js.watch,
      SETUP.watchOpts,
      gulp.parallel('bootstrap:js'),
    );

    // watch for bootstrap scss
    gulp.watch(
      SETUP.bootstrap.scss.watch,
      SETUP.watchOpts,
      gulp.parallel('bootstrap:scss'),
    );

    // watch for project styles
    gulp.watch(
      SETUP.styles.watch,
      SETUP.watchOpts,
      gulp.parallel('styles'),
    );

    // watch for blocks styles
    gulp.watch(
      SETUP.styles.blocks,
      SETUP.watchOpts,
      gulp.parallel('styles'),
    );

    // fatch for root files
    gulp.watch(
      SETUP.root.watch,
      SETUP.watchOpts,
      gulp.parallel('root'),
    );

    /* СТАТИКА */
    // gulp.watch(
    //   [
    //     path.join(settings.paths.static, '**', '*').replace(/\\/g, '/'),
    //   ],
    //   Object.assign({}, watchOpts, {
    //     awaitWriteFinish: {
    //       stabilityThreshold: 1000,
    //       pollInterval: 300,
    //     },
    //   }),
    //   gulp.parallel('static'),
    // );

    // /* STYLUS */
    // gulp.watch(
    //   [
    //     path.join(settings.paths._blocks, '**', '*.styl').replace(/\\/g, '/'),
    //     path.join(settings.paths.stylus, '**', '*.styl').replace(/\\/g, '/'),
    //   ],
    //   watchOpts,
    //   gulp.parallel('stylus'),
    // );

    /* СКРИПТЫ */
    // gulp.watch(
    //   path.join(settings.paths.js.vendors, '**', '*.js').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('scripts:vendors'),
    // );

    // gulp.watch(
    //   path.join(settings.paths.js.plugins, '**', '*.js').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('scripts:plugins'),
    // );

    // gulp.watch(
    //   path.join(settings.paths.js.plugins, '**', '*.css').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('styles:plugins'),
    // );

    // gulp.watch(
    //   path.join(settings.paths._blocks, '**', '*.js').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('scripts:others'),
    // );

    // gulp.watch(
    //   path.join(settings.paths.js.src, '*.js').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('scripts:others'),
    // );

    /* Iconizer */
    // gulp.watch(
    //   path.join(settings.paths.iconizer.icons, '*.svg').replace(/\\/g, '/'),
    //   watchOpts,
    //   gulp.parallel('iconizer:update'),
    // );

    done();
  });

  gulp.task('database', (done) => {
    const DATA = settings.SETUP.database;
    const { watchOpts } = settings.SETUP;

    db.onError = (blockPath, error) => {
      log.error(chalk.bold.red(blockPath));
      log.error(error.message);
    };

    db.set('package', pkg);
    db.set('settings', settings);

    DATA.watch.forEach((paths) => {
      db.create(glob.sync(paths));
    });

    gulp.watch(
      DATA.watch,
      watchOpts,
    )
      .on('change', (block) => {
        db.update(block);
        gulp.series('nunjucks')();
      })
      .on('unlink', (block) => {
        db.delete(block);
        gulp.series('nunjucks')();
      });

    log.info('Data for templates loaded');

    done();
  });


  /**
   * очищаем папку сборки перед сборкой Ж)
   */
  gulp.task('clean', (done) => {
    log('Clean up files...');

    del.sync(settings.FOLDERS.dev);
    done();
  });

  // gulp.task(
  //   'development',
  //   gulp.series(
  //     'clean',
  //     'server',
  //     'database',
  //     'nunjucks',
  //     'stylus',
  //     gulp.parallel(
  //       'static',
  //       'iconizer',
  //       'scripts:vendors',
  //       'scripts:plugins',
  //       'scripts:others',
  //       'styles:plugins',
  //       'bootstrap',
  //     ),
  //     'watch',
  //   ),
  // );

  // gulp.series('development')();

  gulp.task(
    'develop',
    gulp.series(
      'clean',
      'server',
      'database',
      gulp.parallel(
        'nunjucks',
        'styles',
        'root',
        'bootstrap:js',
        'bootstrap:scss',
      ),
      'watch',
    ),
  );

  gulp.series('develop')();
};
