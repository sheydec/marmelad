const fs = require('fs');
const CLI = require('commander');
const path = require('path');
const pkg = require('../package.json');
const chalk = require('chalk');

const gulp = require('gulp');
const rename = require('gulp-rename');

const bsSP = require('browser-sync').create();
const tap = require('gulp-tap');
const iconizer = require('../modules/gulp-iconizer');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const nunjucks = require('gulp-nunjucks-html');
const frontMatter = require('gulp-front-matter');
const translit = require('translit')(require('translit-russian'));

const postHTML = require('gulp-posthtml');
const pretty = require('../modules/gulp-pretty');
const svgSprite = require('gulp-svg-sprite');

const stylus = require('gulp-stylus');
const postcss = require('gulp-postcss');
const focus = require('postcss-focus');
const flexBugsFixes = require('postcss-flexbugs-fixes');
const momentumScrolling = require('postcss-momentum-scrolling');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sass = require('gulp-sass');

const sourcemaps = require('gulp-sourcemaps');
const gif = require('gulp-if');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const groupMQ = require('gulp-group-css-media-queries');
const changed = require('gulp-changed');
const concat = require('gulp-concat');
const include = require('gulp-include');

const decache = require('decache');
const pipeErrorStop = require('pipe-error-stop');
const del = require('del');
const boxen = require('boxen');
const clipboardy = require('clipboardy');

const getAuthParams = params => (typeof params !== 'string' ? [pkg.name, false] : params.split('@'));
const getIconsNamesList = iconsPath => fs.readdirSync(iconsPath).map(iconName => iconName.replace(/.svg/g, ''));
const getNunJucksBlocks = blocksPath => fs.readdirSync(blocksPath).map(el => `${blocksPath}/${el}`);

/**
 * Проверка правильности установки логина и пароля для авторизации
 */
bsSP.use(require('bs-auth'), {
  user: getAuthParams(CLI.auth)[0],
  pass: getAuthParams(CLI.auth)[1],
  use: CLI.auth,
});

const settings = require(path.join(process.cwd(), 'marmelad', 'settings.marmelad'));
let database = {};
let isNunJucksUpdate = false;

/**
 * NUNJUCKS
 */
gulp.task('nunjucks', (done) => {
  const htmlPlugins = [
    require('posthtml-bem')(settings.app.beml),
    require('posthtml-postcss')([
      require('autoprefixer')(settings.app.autoprefixer),
      require('cssnano')(settings.app.cssnano),
    ], {}, /^text\/css$/),
  ];

  let templateName = '';
  let error = false;

  const stream = gulp.src(path.join(settings.paths._pages, '**', '*.html'))
    .pipe(plumber())
    .pipe(gif(!isNunJucksUpdate, changed(settings.paths.dist)))
    .pipe(tap((file) => {
      templateName = path.basename(file.path);
    }))
    .pipe(frontMatter())
    .pipe(nunjucks({
      searchPaths: getNunJucksBlocks(settings.paths._blocks),
      locals: database,
      ext: '.html',

      // TODO: https://gist.github.com/yunusga/1c5236331ddb6caa41a2a71928ac408a

      setUp(env) {
        env.addFilter('translit', str => translit(str).replace(/ /, '_').toLowerCase());
        env.addFilter('limitTo', require('../modules/njk-limitTo'));
        return env;
      },
    }))
    .pipe(pipeErrorStop({
      errorCallback: (err) => {
        error = true;
        console.log(`\n${err.name}: ${err.message.replace(/(unknown path)/, templateName)}\n`);
      },
      successCallback: () => {
        error = false;
        isNunJucksUpdate = false;
      },
    }))
    .pipe(iconizer({ path: path.join(settings.paths.iconizer.src, 'sprite.svg'), _beml: settings.app.beml }))
    .pipe(pretty(settings.app.formatHtml))
    .pipe(postHTML(htmlPlugins))
    .pipe(gulp.dest(settings.paths.dist));

  stream.on('end', () => {
    gutil.log(`NunJucks ${chalk.gray('............................')} ${error ? chalk.bold.red('ERROR\n') : chalk.bold.green('Done')}`);
    bsSP.reload();
    done();
  });

  stream.on('error', (err) => {
    done(err);
  });
});

/**
 * DB
 */
gulp.task('db', (done) => {
  const dataPath = path.join(process.cwd(), 'marmelad', 'data.marmelad.js');

  decache(dataPath);

  database = require(dataPath);

  Object.assign(database.app, {
    settings,
    package: pkg,
    storage: settings.folders.storage,
    icons: getIconsNamesList(settings.paths.iconizer.icons),
  });

  isNunJucksUpdate = true;

  gutil.log(`DB for templates .................... ${chalk.bold.yellow('Refreshed')}`);

  done();
});

/**
 * DB:update
 */
gulp.task('db:update', (done) => {
  gulp.series('db', 'stylus', 'nunjucks')(done);
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

    gutil.log(`Iconizer ............................ ${chalk.bold.green('Done')}`);

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
  const stream = gulp.src(path.join(settings.paths.js.src, '*.js'))
    .pipe(plumber())
    .pipe(include({
      extensions: 'js',
      hardFail: false,
    })).on('error', gutil.log)
    .pipe(babel({
      presets: ['babel-preset-env'].map(require.resolve),
      plugins: ['babel-plugin-transform-object-assign'].map(require.resolve),
      babelrc: false,
    }))
    .pipe(gulp.dest(path.join(settings.paths.storage, settings.folders.js.src)));

  stream.on('end', () => {
    gutil.log(`Scripts others ...................... ${chalk.bold.green('Done')}`);
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

  const stream = gulp.src(path.join(settings.paths.js.vendors, '**', '*.js'))
    .pipe(plumber())
    .pipe(changed(vendorsDist))
    .pipe(gulp.dest(vendorsDist));

  stream.on('end', () => {
    gutil.log(`Scripts vendors ..................... ${chalk.bold.green('Done')}`);
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
  const stream = gulp.src(path.join(settings.paths.js.plugins, '**', '*.js'))
    .pipe(plumber())
    .pipe(concat('plugins.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(path.join(settings.paths.storage, settings.folders.js.src)));

  stream.on('end', () => {
    gutil.log(`Scripts plugins ..................... ${chalk.bold.green('Done')}`);
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
  gulp.src(path.join(settings.paths.js.plugins, '**', '*.css'))
    .pipe(plumber())
    .pipe(concat('plugins.min.css'))
    .pipe(groupMQ())
    .pipe(postcss([
      focus(),
      flexBugsFixes(),
      cssnano({ zindex: false }),
    ]))
    .pipe(gulp.dest(path.join(settings.paths.storage, 'css')))
    .on('end', () => {
      gutil.log(`Plugins CSS ......................... ${chalk.bold.green('Done')}`);
    })
    .pipe(bsSP.stream());

  done();
});

/**
 * сборка стилей блоков, для каждого отдельный css
 */
gulp.task('stylus', (done) => {
  const postcssPlugins = [
    momentumScrolling({ short: true }),
    focus(),
    flexBugsFixes(),
    autoprefixer(settings.app.autoprefixer),
  ];

  const $data = {
    beml: settings.app.beml,
  };

  Object.assign($data, database.app.stylus);

  gulp.src(path.join(settings.paths.stylus, '*.styl'))
    .pipe(plumber())
    .pipe(stylus({
      'include css': true,
      rawDefine: { $data },
    }))
    .pipe(groupMQ())
    .pipe(postcss(postcssPlugins))
    .pipe(gif('*.min.css', postcss([
      cssnano(settings.app.cssnano),
    ])))
    .pipe(gulp.dest(path.join(settings.paths.storage, 'css')))
    .on('end', () => {
      gutil.log(`Stylus CSS .......................... ${chalk.bold.green('Done')}`);
    })
    .pipe(bsSP.stream());

  done();
});

/**
 * СТАТИКА
 */
gulp.task('static', (done) => {
  const stream = gulp.src([
    path.join(settings.paths.static, '**', '*'),
    `!${path.join(settings.paths.static, '**', 'Thumbs.db')}`,
    `!${path.join(settings.paths.static, '**', '*tmp*')}`,
  ])
    .pipe(plumber())
    .pipe(changed(settings.paths.storage))
    .pipe(gulp.dest(settings.paths.storage));

  stream.on('end', () => {
    gutil.log(`Static files copy ................... ${chalk.bold.green('Done')}`);
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
gulp.task('server:static', (done) => {
  bsSP.init(settings.app.bsSP, () => {
    const urls = bsSP.getOption('urls');
    const bsAuth = bsSP.getOption('bsAuth');

    let authString = '';

    if (bsAuth && bsAuth.use) {
      authString = `\n\nuser: ${bsAuth.user}\npass: ${bsAuth.pass}`;
    }

    let clipboardMsg = '';

    if (CLI.clipboard) {
      clipboardMsg = `\n\n${chalk.bold.green(urls.get('local'))} сopied to clipboard!${authString}`;
      clipboardy.writeSync(urls.get('local'));
    }

    console.log(boxen(`${chalk.bold.yellow(pkg.name.toUpperCase())} v${pkg.version} is Started!${clipboardMsg}`, {
      padding: 1,
      margin: 0,
      borderStyle: 'double',
      borderColor: 'green',
    }));

    done();
  });
});

/** ^^^
 * Bootstrap 4.0.0-beta.2 tasks
 ==================================================================== */
gulp.task('bootstrap', (done) => {
  if (settings.bootstrap.use) {
    gulp.parallel('bts4:sass', 'bts4:js')(done);

    /* SCSS */
    gulp.watch(
      path.join(settings.bootstrap.opts.src.scss, '**', '*.scss'),
      gulp.parallel('bts4:sass'),
    );

    /* JS */
    gulp.watch(
      path.join(settings.bootstrap.opts.src.js, '**', '*.js'),
      gulp.parallel('bts4:js'),
    );
  }
});

gulp.task('bts4:sass', (done) => {
  gulp.src(path.join(settings.bootstrap.opts.src.scss, '[^_]*.scss'))
    .pipe(sourcemaps.init())
    .pipe(sass(settings.bootstrap.opts.sass))
    .pipe(postcss([
      autoprefixer(settings.bootstrap.opts.autoprefixer),
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(settings.bootstrap.opts.dest.css))
    .on('end', () => {
      gutil.log(`Bootstrap ${settings.bootstrap.opts.code} SASS ......... ${chalk.bold.green('Done')}`);
    })
    .pipe(bsSP.stream());

  done();
});

gulp.task('bts4:js', (done) => {
  const stream = gulp.src(path.join(settings.bootstrap.opts.src.js, '**', '*.js'))
    .pipe(plumber())
    .pipe(changed(path.join(settings.bootstrap.opts.dest.js)))
    .pipe(gulp.dest(settings.bootstrap.opts.dest.js));

  stream.on('end', () => {
    gutil.log(`Bootstrap ${settings.bootstrap.opts.code} JS ........... ${chalk.bold.green('Done')}`);
    bsSP.reload();
    done();
  });

  stream.on('error', (err) => {
    done(err);
  });
});

gulp.task('watch', (done) => {
  const watchOpts = {
    ignoreInitial: true,
    ignored: [
      path.join('**', 'Thumbs.db'),
      path.join('**', '*tmp*'),
    ],
    usePolling: true,
  };

  /* СТАТИКА */
  gulp.watch(
    [
      path.join(settings.paths.static, '**', '*'),
    ],
    Object.assign({}, watchOpts, {
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 300,
      },
    }),
    gulp.parallel('static'),
  );

  /* STYLUS */
  gulp.watch(
    [
      path.join(settings.paths._blocks, '**', '*.styl'),
      path.join(settings.paths.stylus, '**', '*.styl'),
    ],
    watchOpts,
    gulp.parallel('stylus'),
  );

  /* СКРИПТЫ */
  gulp.watch(
    path.join(settings.paths.js.vendors, '**', '*.js'),
    watchOpts,
    gulp.parallel('scripts:vendors'),
  );

  gulp.watch(
    path.join(settings.paths.js.plugins, '**', '*.js'),
    watchOpts,
    gulp.parallel('scripts:plugins'),
  );

  gulp.watch(
    path.join(settings.paths.js.plugins, '**', '*.css'),
    watchOpts,
    gulp.parallel('styles:plugins'),
  );

  gulp.watch(
    path.join(settings.paths._blocks, '**', '*.js'),
    watchOpts,
    gulp.parallel('scripts:others'),
  );

  gulp.watch(
    path.join(settings.paths.js.src, '*.js'),
    watchOpts,
    gulp.parallel('scripts:others'),
  );

  /* NunJucks Pages */
  gulp.watch(
    path.join(settings.paths._pages, '**', '*.html'),
    watchOpts,
    gulp.parallel('nunjucks'),
  );

  /* NunJucks Blocks */
  gulp.watch(
    path.join(settings.paths._blocks, '**', '*.html'),
    watchOpts, (complete) => {
      isNunJucksUpdate = true;

      gulp.series('nunjucks')(complete);
    },
  );

  /* NunJucks database */
  gulp.watch(
    path.join(settings.paths.marmelad, 'data.marmelad.js'),
    watchOpts,
    gulp.parallel('db:update'),
  );

  /* Iconizer */
  gulp.watch(
    path.join(settings.paths.iconizer.icons, '*.svg'),
    watchOpts,
    gulp.parallel('iconizer:update'),
  );

  done();
});

/**
 * очищаем папку сборки перед сборкой Ж)
 */
gulp.task('clean', (done) => {
  gutil.log('Clean up files...');

  del.sync(settings.paths.dist);
  done();
});

gulp.task(
  'development',
  gulp.series(
    'clean',
    'server:static',
    'db',
    'nunjucks',
    'stylus',
    gulp.parallel(
      'static',
      'iconizer',
      'scripts:vendors',
      'scripts:plugins',
      'scripts:others',
      'styles:plugins',
      'bootstrap',
    ),
    'watch',
  ),
);

gulp.series('development')();
