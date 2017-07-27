#!/usr/bin/env node

'use strict';

const fs                = require('fs');
const path              = require('path');
const CLI               = require('commander');
const pkg               = require('../package.json');
const chalk             = require('chalk');
const bsSP              = require('browser-sync').create();
const getAuthParams     = (params) => typeof params !== 'string' ? [pkg.name, false] : params.split('@');
const getIconsNamesList = (path) => fs.readdirSync(path).map((iconName) => iconName.replace(/.svg/g, ''));


/**
 * Установка флагов/параметров для командной строки
 */
CLI
    .version(pkg.version)
    .option('-a, --auth [user@password]', `set user@password for authorization`)
    .parse(process.argv);


/**
 * Проверка правильности установки логина и пароля для авторизации
 */
bsSP.use(require('bs-auth'), {
    user : getAuthParams(CLI.auth)[0],
    pass : getAuthParams(CLI.auth)[1],
    use  : CLI.auth
});


const gulp              = require('gulp');
const iconizer          = require('../modules/gulp-iconizer');
const boxen             = require('boxen');
const clipboardy        = require('clipboardy');
const babel             = require('gulp-babel');
const jscs              = require('gulp-jscs');
const uglify            = require('gulp-uglify');

const hbs               = require('handlebars');
const compileHandlebars = require('gulp-compile-handlebars');
const hbsLayouts        = require('handlebars-layouts');

const nunjucks          = require('gulp-nunjucks-html');
const frontMattter      = require('gulp-front-matter');

const beml              = require('gulp-beml');
const svgSprite         = require('gulp-svg-sprite');

const stylus            = require('gulp-stylus');
const postcss           = require('gulp-postcss');
const focus             = require('postcss-focus');
const autoprefixer      = require('autoprefixer');
const flexBugsFixes     = require('postcss-flexbugs-fixes');
const groupMQ           = require('gulp-group-css-media-queries');
const cssnano           = require('cssnano');

const gutil             = require('gulp-util');
const plumber           = require('gulp-plumber');
const rename            = require('gulp-rename');
const header            = require('gulp-header');
const changed           = require('gulp-changed');
const concat            = require('gulp-concat');
const include           = require('gulp-include');
const watch             = require('gulp-watch');
const batch             = require('gulp-batch');
const decache           = require('decache');
const requireDir        = require('require-dir');
const runSequence       = require('run-sequence');
const pipeErrorStop     = require('pipe-error-stop');
const del               = require('del');

let settings = require(path.join('..', 'boilerplate', 'settings.marmelad'));
let database = {};

/**
 * NUNJUCKS
 */

/**
 * list of blocks directories
 *
 * @param blocksPath {String} path to blocks destination
 * @returns {Array} blocks paths
 */
const getNunJucksBlocks = (blocksPath) => {

    let folders = fs.readdirSync(blocksPath);
    let partials = [];

    folders.forEach(function (el) {
        partials.push(blocksPath + '/' + el);
    });

    return partials;
};

gulp.task('nunjucks', (done) => {

    let stream = gulp.src(path.join(settings.paths._pages,'**', '*.html'))
        .pipe(plumber())
        .pipe(iconizer({path: path.join(settings.paths.iconizer.src, 'sprite.svg')}))
        .pipe(frontMattter())
        .pipe(nunjucks({
            searchPaths: getNunJucksBlocks(settings.paths._blocks),
            locals: database,
            ext: '.html'
        }))
        .pipe(pipeErrorStop())
        .pipe(beml(settings.app.beml))
        .pipe(gulp.dest(settings.paths.dist));

    stream.on('end', function() {
        gutil.log(`NunJucks ${chalk.gray('............................')} ${chalk.bold.green('Done')}`);
        bsSP.reload();
        done();
    });

    stream.on('error', function(err) {
        done(err);
    });
});

/**
 * DB
 */
gulp.task('db', (done) => {

    let dataPath = path.join(process.cwd(), 'marmelad', 'data.marmelad.js');

    decache(dataPath);

    database = require(dataPath);

    Object.assign(database.app, {
        package  : pkg,
        settings : settings,
        storage  : settings.folders.storage,
        icons    : getIconsNamesList(settings.paths.iconizer.icons)
    });

    gutil.log(`DB for templates .................... ${chalk.bold.yellow('Refreshed')}`);

    done();

});

/**
 * DB:update
 */
gulp.task('db:update', (done) => {
    runSequence('db', 'nunjucks', done);
});



/**
 * Iconizer
 */
gulp.task('iconizer', (done) => {

    let stream = gulp.src(path.join(settings.paths.iconizer.icons, '*.svg'))
        .pipe(svgSprite(settings.app.svgSprite))
        .pipe(gulp.dest('.'));

    stream.on('end', function() {

        Object.assign(database, {
            app : {
                icons : getIconsNamesList(settings.paths.iconizer.icons)
            }
        });

        gutil.log(`Iconizer ............................ ${chalk.bold.green('Done')}`);

        done();
    });

    stream.on('error', function(err) {
        done(err);
    });
});

/**
 * Iconizer update
 */
gulp.task('iconizer:update', (done) => {
    runSequence('iconizer', 'nunjucks', done);
});




/**
 * list of blocks directories
 *
 * @param blocksPath {String} path to blocks destination
 * @returns {Array} blocks paths
 */
let getHbsPartialsPaths = (blocksPath) => {

    let folders = fs.readdirSync(blocksPath);
    let partials = [];

    folders.forEach(function (el) {
        partials.push(blocksPath + '/' + el);
    });

    return partials;
};

/**
 * register handlebars-layouts helpers
 * https://www.npmjs.com/package/handlebars-layouts
 */

function hpsHelperCreate(blockName) {

    const settings = require(path.join(process.cwd(), 'marmelad', 'settings.marmelad'));

    let pathToBlockDir = path.join(settings.paths._blocks, blockName);
    let pathToBlockFile = path.join(pathToBlockDir, blockName);
    let tpl_hbs = `<div block="m-${blockName}">${blockName} content</div><!-- b:m-${blockName} -->`;
    let tpl_styl = `.m-${blockName} {}`;

    if (!fs.existsSync(pathToBlockDir)) {

        fs.ensureDirSync(pathToBlockDir);
        fs.writeFileSync(`${pathToBlockFile}.hbs`, tpl_hbs, 'utf-8');
        fs.writeFileSync(`${pathToBlockFile}.styl`, tpl_styl, 'utf-8');
        fs.writeFileSync(`${pathToBlockFile}.js`, '', 'utf-8');

        console.log(`\n[${gutil.colors.green('CREATE BLOCK')}] ${blockName} ${gutil.colors.green('successfully')}\n`);
    }
}

compileHandlebars.Handlebars.registerHelper(hbsLayouts(compileHandlebars.Handlebars));
compileHandlebars.Handlebars.registerHelper('create', function(blockName) {
    hpsHelperCreate(blockName);
});

/**
 * обновление данных для шаблонов
 */
gulp.task('handlebars:data', (done) => {

    let dataPath = path.join(process.cwd(), 'marmelad', 'data.marmelad.js');

    decache(dataPath);

    database = require(dataPath);

    Object.assign(database.app, {
        package  : pkg,
        settings : settings,
        storage  : settings.folders.storage,
        icons    : getIconsNamesList(settings.paths.iconizer.icons)
    });

    gutil.log(`Database for handlebars templates ... ${chalk.bold.yellow('Refreshed')}`);

    done();

});

/**
 * обновление данных для шаблонов
 * пересборка шаблонов с новыми данными
 */
gulp.task('handlebars:refresh', (done) => {
    runSequence('handlebars:data', 'handlebars:pages', done);
});

/**
 * сборка шаблонов handlebars
 * https://www.npmjs.com/package/gulp-compile-handlebars
 */
gulp.task('handlebars:pages', function(done) {

    let stream = gulp.src(settings.paths._pages + '/**/*.{hbs,handlebars}')
        .pipe(plumber())
        .pipe(iconizer({path: path.join(settings.paths.iconizer.src, 'sprite.svg')}))
        .pipe(beml(settings.app.beml))
        .pipe(rename({extname: '.html'}))
        .pipe(gulp.dest(settings.paths.dist));

    stream.on('end', function() {
        gutil.log(`Handlebars pages .................... ${chalk.bold.green('Done')}`);
        bsSP.reload();
        done();
    });

    stream.on('error', function(err) {
        done(err);
    });
});

gulp.task('handlebars:blocks', function(done) {

    let pathToBlocks = path.join(settings.paths._blocks, '**', '*.{hbs,handlebars}');

    let stream = gulp.src(settings.paths._blocks + '/**/*.{hbs,handlebars}')
        .pipe(plumber())
        .pipe(changed(pathToBlocks))
        .pipe(iconizer({path: path.join(settings.paths.iconizer.src, 'sprite.svg')}))
        .pipe(beml(settings.app.beml))
        .pipe(rename({
            dirname : '',
            extname : '.html'
        }))
        .pipe(gulp.dest(path.join(settings.paths.dist, 'partials')));

    stream.on('end', function() {
        gutil.log(`Handlebars blocks ................... ${chalk.bold.green('Done')}`);
        bsSP.reload();
        done();
    });

    stream.on('error', function(err) {
        done(err);
    });
});



/**
 * scripts from blocks
 */
gulp.task('scripts:blocks', (done) => {

    return gulp.src(path.join(settings.paths._blocks, '**', '*.js'))
        .pipe(plumber())
        .pipe(jscs({ configPath : path.join('marmelad', '.jscsrc') }))
        .pipe(jscs.reporter());
});

/**
 * scripts from blocks
 */
gulp.task('scripts:others', ['scripts:blocks'], (done) => {

    let stream = gulp.src(path.join(settings.paths.js.src, '*.js'))
        .pipe(plumber())
        .pipe(include({
            extensions: 'js',
            hardFail: false
        })).on('error', gutil.log)
        .pipe(babel({
            presets: ['babel-preset-es2015'].map(require.resolve),
            plugins: ['babel-plugin-transform-object-assign'].map(require.resolve),
            babelrc: false
        }))
        .pipe(gulp.dest(path.join(settings.paths.storage,  settings.folders.js.src)));

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

    let vendorsDist = path.join(settings.paths.storage,  settings.folders.js.src, settings.folders.js.vendors);

    let stream = gulp.src(settings.paths.js.vendors + '/**/*.js')
        .pipe(plumber())
        .pipe(changed(vendorsDist))
        .pipe(gulp.dest(vendorsDist));

    stream.on('end', function () {
        gutil.log(`Scripts vendors ..................... ${chalk.bold.green('Done')}`);
        bsSP.reload();
        done();
    });

    stream.on('error', function (err) {
        done(err);
    });

});

/**
 * СКРИПТЫ ПЛАГИНОВ
 */
gulp.task('scripts:plugins', (done) => {

    let stream = gulp.src(settings.paths.js.plugins + '/**/*.js')
        .pipe(plumber())
        .pipe(concat('plugins.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join(settings.paths.storage,  settings.folders.js.src)));

    stream.on('end', function () {
        gutil.log(`Scripts plugins ..................... ${chalk.bold.green('Done')}`);
        bsSP.reload();
        done();
    });

    stream.on('error', function (err) {
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
gulp.task('stylus', function(done) {

    let $data = {
        beml : settings.app.beml
    };

    Object.assign($data, database.app.stylus);

    gulp.src(path.join(settings.paths.stylus, '*.styl'))
        .pipe(plumber())
        .pipe(stylus({
            'include css': true,
            rawDefine : { $data }
        }))
        .pipe(groupMQ())
        .pipe(postcss([
            focus(),
            flexBugsFixes(),
            autoprefixer(settings.app.autoprefixer)
        ]))
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

    let stream = gulp.src([
        settings.paths.static + '/**/*.*',
        '!' + settings.paths.static + '/**/Thumbs.db',
        '!' + settings.paths.static + '/**/*tmp*'
    ])
        .pipe(plumber())
        .pipe(changed(settings.paths.dist))
        .pipe(gulp.dest(settings.paths.dist));

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

    // settings.app.bsSP.server.middleware = [
    //
    //     function (req, res, next) {
    //
    //         let reqUrl = req.url || req.originalUrl;
    //         let ext = '.html';
    //
    //         if (path.extname(reqUrl) === ext) {
    //
    //             let partialsFiles = fs.readdirSync(path.join(settings.paths.dist, 'partials'));
    //
    //             partialsFiles.forEach(function (partial) {
    //
    //                 let partialPath = path.join(settings.paths.dist, 'partials', partial);
    //                 let template = fs.readFileSync(partialPath, 'utf8');
    //
    //                 hbs.registerPartial(path.basename(partial, '.html'), template);
    //             });
    //
    //
    //             let page = path.join(process.cwd(), settings.folders.dist, path.basename(reqUrl, ext));
    //             let source = fs.readFileSync(page + ext, 'utf8');
    //             let template = hbs.compile(source);
    //             let result = template(database);
    //
    //             res.writeHead(200, {
    //                 'Content-Type': 'text/html; charset=UTF-8',
    //                 'Generator': 'marmelad v.' + pkg.version
    //
    //             });
    //             res.end(result);
    //
    //         } else {
    //             next();
    //         }
    //
    //     }
    // ];

    bsSP.init(settings.app.bsSP, () => {

        let urls = bsSP.getOption('urls');

        console.log(boxen(`${chalk.bold.yellow(pkg.name.toUpperCase())} v${pkg.version} is Started!\n\n${chalk.bold.green(urls.get('local'))} сopied to clipboard!`, {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'green'
        }));

        clipboardy.writeSync(urls.get('local'));

        done();
    });
});

gulp.task('watch', () => {

    /* СТАТИКА */
    watch([
        settings.paths.static + '/**/*.*',
        '!' + settings.paths.static + '/**/Thumbs.db',
        '!' + settings.paths.static + '/**/*tmp*'
    ], batch((events, done) => {
        gulp.start('static', done);
    }));

    /* STYLUS */
    watch([
        path.join(settings.paths._blocks, '**', '*.styl'),
        path.join(settings.paths.stylus, '**', '*.styl')
    ], batch(function (events, done) {
        gulp.start('stylus', done);
    }));

    /* СКРИПТЫ */
    watch(path.join(settings.paths.js.vendors, '**', '*.js'), batch((events, done) => {
        gulp.start('scripts:vendors', done);
    }));

    watch(path.join(settings.paths.js.plugins, '**', '*.js'), batch((events, done) => {
        gulp.start('scripts:plugins', done);
    }));
    watch(path.join(settings.paths.js.plugins, '**', '*.css'), batch((events, done) => {
        gulp.start('styles:plugins', done);
    }));

    watch(path.join(settings.paths._blocks, '**', '*.js'), batch(function (events, done) {
        gulp.start('scripts:others', done);
    }));
    watch(path.join(settings.paths.js.src, '*.js'), batch(function (events, done) {
        gulp.start('scripts:others', done);
    }));

    /* ШАБЛОНЫ */
    watch(path.join(settings.paths._pages, '**', '*.{hbs,handlebars}'), batch((events, done) => {
        gulp.start('handlebars:pages', done);
    }));
    /* БЛОКИ */
    watch(path.join(settings.paths._blocks, '**', '*.{hbs,handlebars}'), batch((events, done) => {

        runSequence(
            'handlebars:blocks',
            //'handlebars:beml2styl',
            'handlebars:pages',
            done
        );
    }));


    /* NunJucks static */
    watch([
        path.join(settings.paths._pages, '**', '*.html'),
        path.join(settings.paths._blocks, '**', '*.html')
    ], batch((events, done) => {
        gulp.start('nunjucks', done);
    }));


    /* NunJucks database */
    watch(path.join(settings.paths.marmelad, 'data.marmelad.js'), batch((events, done) => {
        gulp.start('db:update', done);
    }));


    /* Iconizer */
    watch(path.join(settings.paths.iconizer.icons, '*.svg'), batch(function (events, done) {
        gulp.start('iconizer:update', done);
    }));

});

/**
 * очищаем папку сборки перед сборкой Ж)
 */
gulp.task('clean', (done) => {
    del.sync(settings.paths.dist);
    done();
});

gulp.task('marmelad:start', function(done) {

    runSequence(
        'clean',
        'server:static',
        'static',
        'iconizer',
        // 'handlebars:data',
        // 'handlebars:blocks',
        // 'handlebars:pages',
        'db',
        'nunjucks',
        'scripts:vendors',
        'scripts:plugins',
        'scripts:others',
        'styles:plugins',
        'stylus',
        'watch',

        done);

});

/**
 * project init
 */
gulp.task('marmelad:init', function(done) {

    let stream = gulp.src(
        [path.join(__dirname.replace('bin', ''), 'boilerplate', '**', '*.*')],
        {
            dot: true
        })
        .pipe(gulp.dest(path.join(process.cwd(), 'marmelad')));

    stream.on('end', function () {

        console.log(boxen(`${pkg.name.toUpperCase()} v${pkg.version}\nBoilerplate successfully copied\n\ntype ${pkg.name} --help for CLI help`, {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'yellow'
        }));

        done();
    });

    stream.on('error', function (err) {
        done(err);
    });

});

fs.exists(path.join('marmelad', 'settings.marmelad.js'), function(exists) {

    if (exists) {

        settings = require(path.join(process.cwd(), 'marmelad', 'settings.marmelad'));

        hbs.registerHelper(hbsLayouts(hbs));
        hbs.registerHelper('create', function(blockName) {
            hpsHelperCreate(blockName);
        });

        let helpers = requireDir(path.join(process.cwd(), settings.paths._helpers));

        for(let h in helpers) {
            hbs.registerHelper(h, helpers[h]);
        }

        gulp.start('marmelad:start');

    } else {
        gulp.start('marmelad:init');
    }
});
