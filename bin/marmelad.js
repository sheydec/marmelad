#!/usr/bin/env node

const fs = require('fs');
const CLI = require('commander');
const path = require('path');
const pkg = require('../package.json');
const chalk = require('chalk');
const gulp = require('gulp');
const bsSP = require('browser-sync').create();
const tap = require('gulp-tap');
const iconizer = require('../modules/gulp-iconizer');

const babel = require('gulp-babel');
const jscs = require('gulp-jscs');
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
const watch = require('gulp-watch');
const batch = require('gulp-batch');

const decache = require('decache');
const runSequence = require('run-sequence');
const pipeErrorStop = require('pipe-error-stop');
const del = require('del');
const boxen = require('boxen');
const clipboardy = require('clipboardy');

const getAuthParams = params => (typeof params !== 'string' ? [pkg.name, false] : params.split('@'));
const getIconsNamesList = iconsPath => fs.readdirSync(iconsPath).map(iconName => iconName.replace(/.svg/g, ''));
const getNunJucksBlocks = blocksPath => fs.readdirSync(blocksPath).map(el => `${blocksPath}/${el}`);

/**
 * Установка флагов/параметров для командной строки
 */
CLI
  .version(pkg.version)
  .option('-a, --auth [user@password]', 'set user@password for authorization')
  .option('-c, --clipboard', 'copy server URL to clipboard on startup');

// создание страницы
CLI
  .command('cp <name>')
  .description('Create new page')
  .action((pageName) => {
    require('../commands/cp')(pageName);
  })
  .on('--help', () => {
    console.log();
  });


// создание блока
CLI
  .command('cb <name>')
  .description('Create new block')
  .option('-t, --techs [html,js,styl]', 'Files exxtensions for new block', 'html,js,styl')
  .action((pageName, opts) => {
    require('../commands/cb')(pageName, opts.techs);
  })
  .on('--help', () => {
    console.log();
  });

// парсим аргументы командной строки (старт модуля)
CLI.parse(process.argv);

/**
 * Проверка правильности установки логина и пароля для авторизации
 */
bsSP.use(require('bs-auth'), {
  user: getAuthParams(CLI.auth)[0],
  pass: getAuthParams(CLI.auth)[1],
  use: CLI.auth,
});

let settings = require(path.join('..', 'boilerplate', 'settings.marmelad'));
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
  runSequence('db', 'stylus', 'nunjucks', done);
});


/**
 * Iconizer
 */
gulp.task('iconizer', (done) => {
  const stream = gulp.src(path.join(settings.paths.iconizer.icons, '*.svg'))
    .pipe(svgSprite(settings.app.svgSprite))
    .pipe(gulp.dest('.'));

  stream.on('end', () => {
    Object.assign(database, {
      app: {
        icons: getIconsNamesList(settings.paths.iconizer.icons),
      },
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
  runSequence('iconizer', 'db:update', done);
});


/**
 * scripts from blocks
 */
gulp.task('scripts:blocks', () => gulp.src(path.join(settings.paths._blocks, '**', '*.js'))
  .pipe(plumber())
  .pipe(jscs({ configPath: path.join('marmelad', '.jscsrc') }))
  .pipe(jscs.reporter()));

/**
 * scripts from blocks
 */
gulp.task('scripts:others', ['scripts:blocks'], (done) => {
  const stream = gulp.src(path.join(settings.paths.js.src, '*.js'))
    .pipe(plumber())
    .pipe(include({
      extensions: 'js',
      hardFail: false,
    })).on('error', gutil.log)
    .pipe(babel({
      presets: ['babel-preset-es2015'].map(require.resolve),
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
    path.join(settings.paths.static, '**', '*.*'),
    `!${path.join(settings.paths.static, '**', 'Thumbs.db')}`,
    `!${path.join(settings.paths.static, '**', 'tmp')}`,
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
 * Bootstrap 4.0.0-beta tasks
 ==================================================================== */
gulp.task('bts4', (done) => {
  runSequence(
    'bts4:sass',
    'bts4:js',
    done,
  );

  /* SCSS */
  watch(path.join(settings.app.bts['4'].src.css, '**', '*.scss'), batch((events, complete) => {
    gulp.start('bts4:sass', complete);
  }));

  /* JS */
  watch(path.join(settings.app.bts['4'].src.js, '**', '*.js'), batch((events, complete) => {
    gulp.start('bts4:js', complete);
  }));
});

gulp.task('bts4:sass', (done) => {
  gulp.src(path.join(settings.app.bts['4'].src.css, '[^_]*.scss'))
    .pipe(sourcemaps.init())
    .pipe(sass(settings.app.bts['4'].sass))
    .pipe(postcss([
      autoprefixer(settings.app.bts['4'].autoprefixer),
    ]))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(settings.app.bts['4'].dest.css))
    .on('end', () => {
      gutil.log(`Bootstrap ${settings.app.bts['4'].code} SASS ......... ${chalk.bold.green('Done')}`);
    })
    .pipe(bsSP.stream());

  done();
});

gulp.task('bts4:js', (done) => {
  const stream = gulp.src(path.join(settings.app.bts['4'].src.js, '**', '*.js'))
    .pipe(plumber())
    .pipe(changed(path.join(settings.app.bts['4'].dest.js)))
    .pipe(gulp.dest(settings.app.bts['4'].dest.js));

  stream.on('end', () => {
    gutil.log(`Bootstrap ${settings.app.bts['4'].code} JS ........... ${chalk.bold.green('Done')}`);
    bsSP.reload();
    done();
  });

  stream.on('error', (err) => {
    done(err);
  });
});

gulp.task('watch', (done) => {
  /* СТАТИКА */
  watch([
    path.join(settings.paths.static, '**', '*.*'),
    `!${path.join(settings.paths.static, '**', 'Thumbs.db')}`,
    `!${path.join(settings.paths.static, '**', 'tmp')}`,
  ], {
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 500,
    },
  }, batch((events, complete) => {
    gulp.start('static', complete);
  }));

  /* STYLUS */
  watch([
    path.join(settings.paths._blocks, '**', '*.styl'),
    path.join(settings.paths.stylus, '**', '*.styl'),
  ], batch((events, complete) => {
    gulp.start('stylus', complete);
  }));

  /* СКРИПТЫ */
  watch(path.join(settings.paths.js.vendors, '**', '*.js'), batch((events, complete) => {
    gulp.start('scripts:vendors', complete);
  }));

  watch(path.join(settings.paths.js.plugins, '**', '*.js'), batch((events, complete) => {
    gulp.start('scripts:plugins', complete);
  }));
  watch(path.join(settings.paths.js.plugins, '**', '*.css'), batch((events, complete) => {
    gulp.start('styles:plugins', complete);
  }));

  watch(path.join(settings.paths._blocks, '**', '*.js'), batch((events, complete) => {
    gulp.start('scripts:others', complete);
  }));
  watch(path.join(settings.paths.js.src, '*.js'), batch((events, complete) => {
    gulp.start('scripts:others', complete);
  }));

  /* NunJucks Pages */
  watch(path.join(settings.paths._pages, '**', '*.html'), batch((events, complete) => {
    gulp.start('nunjucks', complete);
  }));

  /* NunJucks Blocks */
  watch([path.join(settings.paths._blocks, '**', '*.html')], batch((events, complete) => {
    isNunJucksUpdate = true;
    gulp.start('nunjucks', complete);
  }));

  /* NunJucks database */
  watch(path.join(settings.paths.marmelad, 'data.marmelad.js'), batch((events, complete) => {
    gulp.start('db:update', complete);
  }));

  /* Iconizer */
  watch(path.join(settings.paths.iconizer.icons, '*.svg'), batch((events, complete) => {
    gulp.start('iconizer:update', complete);
  }));

  done();
});

/**
 * очищаем папку сборки перед сборкой Ж)
 */
gulp.task('clean', (done) => {
  del.sync(settings.paths.dist);
  done();
});

gulp.task('marmelad:start', (done) => {
  runSequence(
    'clean',
    'server:static',
    'static',
    'iconizer',
    'db',
    'nunjucks',
    'scripts:vendors',
    'scripts:plugins',
    'scripts:others',
    'styles:plugins',
    'stylus',
    `bts${settings.app.bts.use}`,
    'watch',
    done,
  );
});

/**
 * project init
 */
gulp.task('marmelad:init', (done) => {
  const stream = gulp.src(
    [path.join(__dirname.replace('bin', ''), 'boilerplate', '**', '*.*')],
    { dot: true },
  )
    .pipe(gulp.dest(path.join(process.cwd(), 'marmelad')));

  stream.on('end', () => {
    console.log(boxen(`${chalk.bold.yellow(pkg.name.toUpperCase())} v${pkg.version}\nBoilerplate successfully copied\n\ntype ${pkg.name} --help for CLI help`, {
      padding: 1,
      margin: 0,
      borderStyle: 'double',
      borderColor: 'yellow',
    }));

    done();
  });

  stream.on('error', (err) => {
    done(err);
  });
});

fs.exists(path.join('marmelad', 'settings.marmelad.js'), (exists) => {
  if (exists) {
    settings = require(path.join(process.cwd(), 'marmelad', 'settings.marmelad'));
    gulp.start('marmelad:start');
  } else {
    gulp.start('marmelad:init');
  }
});
